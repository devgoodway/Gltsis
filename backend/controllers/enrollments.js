const {
  Enrollment,
  Syllabus,
  Registration,
  Season,
  User,
} = require("../models");
const _ = require("lodash");

const isTimeOverlapped = (enrollments, syllabus) => {
  const unavailableTime = _.flatten(
    enrollments.map((enrollment) => enrollment.time)
  );
  const unavailableTimeLabels = _([...unavailableTime, ...syllabus.time])
    .groupBy((x) => x.label)
    .pickBy((x) => x.length > 1)
    .keys()
    .value();
  return unavailableTimeLabels.length != 0;
};

module.exports.enroll = async (req, res) => {
  try {
    const _Enrollment = Enrollment(req.user.academyId);

    // find syllabus
    const syllabus = await Syllabus(req.user.academyId).findById(
      req.body.syllabus
    );
    if (!syllabus)
      return res.status(404).send({ message: "수업 정보를 찾을 수 없습니다." });

    // find registration
    const registration = await Registration(req.user.academyId).findById(
      req.body.registration
    );
    if (!registration)
      return res.status(404).send({ message: "등록 정보를 찾을 수 없습니다." });

    if (req.user.userId !== registration.userId)
      return res
        .status(401)
        .send({ message: "유저 정보와 등록 정보가 일치하지 않습니다." });

    // find season & check permission
    const season = await Season(req.user.academyId).findById(syllabus.season);
    if (!season) return res.status(404).send({ message: "season not found" });
    if (
      !season.checkPermission(
        "enrollment",
        registration.userId,
        registration.role
      )
    )
      return res.status(401).send({ message: "수강신청 권한이 없습니다." });

    // 1. 승인된 수업인지 확인
    for (let i = 0; i < syllabus.teachers.length; i++)
      if (!syllabus.teachers[i].confirmed)
        return res.status(404).send({ message: "승인되지 않은 수업입니다." });

    // 2. 이미 신청한 수업인지 확인
    const exEnrollments = await _Enrollment.find({
      studentId: registration.userId,
      syllabus: syllabus._id,
    });
    if (_.find(exEnrollments, { syllabus: syllabus._id }))
      return res.status(409).send({ message: "이미 신청한 수업입니다." });

    // 3. 수강정원 확인
    if (syllabus.limit != 0) {
      const enrollmentsCnt = await _Enrollment.countDocuments({
        syllabus: syllabus._id,
      });
      if (enrollmentsCnt >= syllabus.limit)
        return res.status(409).send({ message: "수강정원이 다 찼습니다." });
    }

    // 4. 수강신청 가능한 시간인가?
    if (isTimeOverlapped(exEnrollments, syllabus))
      return res.status(409).send({
        message: `시간표가 중복되었습니다.`,
      });

    // 수강신청 완료 (도큐먼트 저장)
    const enrollment = new _Enrollment({
      ...syllabus.getSubdocument(),
      student: registration.user,
      studentId: registration.userId,
      studentName: registration.userName,
      studentGrade: registration.grade,
    });

    // evaluation 동기화
    enrollment.evaluation = {};
    for (let obj of season.formEvaluation) {
      if (obj.combineBy === "term") {
        const e2 = await _Enrollment.findOne({
          season: enrollment.season,
          studentId: enrollment.studentId,
          subject: enrollment.subject,
        });
        if (e2) {
          enrollment.evaluation[obj.label] = e2.evaluation[obj.label] || "";
        }
      } else if (obj.combineBy === "year") {
        const e2 = await _Enrollment.findOne({
          school: enrollment.school,
          year: enrollment.year,
          studentId: enrollment.studentId,
          subject: enrollment.subject,
        });
        if (e2) {
          enrollment.evaluation[obj.label] = e2.evaluation[obj.label] || "";
        }
      }
    }
    await enrollment.save();
    return res.status(200).send(enrollment);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

module.exports.enrollbulk = async (req, res) => {
  try {
    const _Enrollment = Enrollment(req.user.academyId);

    const syllabus = await Syllabus(req.user.academyId).findById(
      req.body.syllabus
    );
    if (!syllabus)
      return res.status(404).send({ message: "수업 정보를 찾을 수 없습니다." });

    // mentor 확인 & confirmed 확인
    let isMentor = false;
    for (let teacher of syllabus.teachers) {
      if (teacher.userId === req.user.userId) {
        isMentor = true;
        break;
      }
      if (!teacher.confirmed)
        return res.status(409).send({ message: "syllabus is not confirmed" });
    }
    if (!isMentor)
      return res.status(403).send({ message: "수업 초대 권한이 없습니다." });

    // 2. 수강정원 확인
    if (syllabus.limit != 0) {
      const enrollmentsCnt = await _Enrollment.countDocuments({
        syllabus: syllabus._id,
      });
      if (enrollmentsCnt + req.body.students.length > syllabus.limit)
        return res.status(409).send({ message: "수강정원을 초과합니다." });
    }

    // find season & check permission
    const season = await Season(req.user.academyId).findById(syllabus.season);
    if (!season) return res.status(404).send({ message: "season not found" });

    const enrollments = [];
    const syllabusSubdocument = syllabus.getSubdocument();

    for (let student of req.body.students) {
      // 3. 이미 신청한 수업인가?
      const exEnrollments = await _Enrollment.find({
        studentId: student.userId,
        syllabus: syllabus._id,
      });

      if (_.find(exEnrollments, { syllabus: syllabus._id })) {
        enrollments.push({
          success: { status: false, message: "이미 신청함" },
          ...student,
        });
      }

      // 4. 수강신청 가능한 시간인가?
      else if (isTimeOverlapped(exEnrollments, syllabus))
        enrollments.push({
          success: { status: false, message: "시간표 중복" },
          ...student,
        });
      else {
        try {
          const enrollment = new _Enrollment({
            ...syllabusSubdocument,
            studentId: student.userId,
            studentName: student.userName,
            studentGrade: student.grade,
          });

          // evaluation 동기화
          enrollment.evaluation = {};
          for (let obj of season.formEvaluation) {
            if (obj.combineBy === "term") {
              const e2 = await _Enrollment.findOne({
                season: enrollment.season,
                studentId: enrollment.studentId,
                subject: enrollment.subject,
              });
              if (e2) {
                enrollment.evaluation[obj.label] =
                  e2.evaluation[obj.label] || "";
              }
            } else if (obj.combineBy === "year") {
              const e2 = await _Enrollment.findOne({
                school: enrollment.school,
                year: enrollment.year,
                studentId: enrollment.studentId,
                subject: enrollment.subject,
              });
              if (e2) {
                enrollment.evaluation[obj.label] =
                  e2.evaluation[obj.label] || "";
              }
            }
          }
          await enrollment.save();
          enrollments.push({ success: { status: true }, ...student });
        } catch (error) {
          enrollments.push({
            success: { status: false, message: err.message },
            ...student,
          });
        }
      }
    }
    // const newEnrollments = await Enrollment(req.user.academyId).insertMany(
    //   enrollments
    // );
    return res.status(200).send({ enrollments });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

module.exports.find = async (req, res) => {
  try {
    // find by enrollment _id (only student can view)
    if (req.params._id) {
      const enrollment = await Enrollment(req.user.academyId).findById(
        req.params._id
      );
      if (!enrollment)
        return res.status(404).send({ message: "enrollment not found" });

      // if (enrollment.studentId != req.user.userId)
      //   return res.status(401).send(); 임시적으로 권한 허용

      return res.status(200).send(enrollment);
    }

    const { season, year, studentId, syllabus, syllabuses } = req.query;

    // find by season & studentId
    if (season && studentId) {
      const enrollments = await Enrollment(req.user.academyId).find({
        season,
        studentId,
      });
      //  .select("-evaluation"); 임시적으로 권한 허용
      return res.status(200).send({ enrollments });
    }

    if (year && studentId) {
      const enrollments = await Enrollment(req.user.academyId).find({
        year,
        studentId,
      });
      //   .select("-evaluation"); // 임시적으로 권한 허용
      return res.status(200).send({ enrollments });
    }

    if (studentId) {
      const enrollments = await Enrollment(req.user.academyId).find({
        studentId,
      });
      //  .select("-evaluation"); 임시적으로 권한 허용
      return res.status(200).send({ enrollments });
    }

    // find by syllabus
    if (syllabus) {
      const enrollments = await Enrollment(req.user.academyId)
        .find({ syllabus })
        .select(["studentId", "studentName", "studentGrade"]);
      return res.status(200).send({ enrollments });
    }

    // find by multiple syllabuses
    if (syllabuses) {
      const enrollments = await Enrollment(req.user.academyId)
        .find({ syllabus: { $in: syllabuses.split(",") } })
        .select("syllabus");

      return res.status(200).send({ enrollments });
    }
    return res.status(400).send();
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

module.exports.findEvaluations = async (req, res) => {
  try {
    // evaluation 가져오는 권한 설정 필요
    // if (req.user.userId != studentId) return res.status(401).send();

    if (req.query.syllabus) {
      const syllabus = await Syllabus(req.user.academyId).findById(
        req.query.syllabus
      );
      if (!syllabus)
        return res.status(404).send({ message: "syllabus not found" });

      const enrollments = await Enrollment(req.user.academyId)
        .find({
          syllabus: req.query.syllabus,
        })
        .select(["-info"]);

      return res.status(200).send({
        syllabus: syllabus.getSubdocument(),
        enrollments: enrollments.map((eval) => {
          return {
            _id: eval._id,
            student: eval.student,
            studentId: eval.studentId,
            studentName: eval.studentName,
            studentGrade: eval.studentGrade,
            evaluation: eval.evaluation,
            createdAt: eval.createdAt,
            updatedAt: eval.updatedAt,
          };
        }),
      });
    }

    const enrollments = await Enrollment(req.user.academyId)
      .find(req.query)
      .select("-info");
    return res.status(200).send({ enrollments });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

module.exports.updateEvaluation = async (req, res) => {
  try {
    const enrollment = await Enrollment(req.user.academyId).findById(
      req.params._id
    );
    if (!enrollment)
      return res.status(404).send({ message: "enrollment not found" });

    // 유저 권한 확인
    const season = await Season(req.user.academyId).findById(enrollment.season);
    if (!season) return res.status(404).send({ message: "season not found" });

    const registration = await Registration(req.user.academyId).findOne({
      season: enrollment.season,
      userId: req.user.userId,
    });
    if (!registration)
      return res.status(404).send({ message: "registration not found" });

    if (
      !season.checkPermission("evaluation", req.user.userId, registration.role)
    )
      return res.status(409).send({ message: "you have no permission" });

    //authentication 다시 설정해야 함
    if (
      enrollment.studentId === req.user.userId ||
      _.find(enrollment.teachers, { userId: req.user.userId })
    ) {
      enrollment.evaluation = { ...enrollment.evaluation, ...req.body.new };
      await enrollment.save();
      console.log("enrollment is now ", enrollment);
      return res.status(200).send({ evaluation: enrollment.evaluation });
    }

    return res.status(401).send();
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

module.exports.updateEvaluation2 = async (req, res) => {
  try {
    if (req.query.by !== "mentor" && req.query.by !== "student")
      return res
        .status(400)
        .send({ message: `req.query.by is ${req.query.by}` });

    const enrollment = await Enrollment(req.user.academyId).findById(
      req.params._id
    );
    if (!enrollment)
      return res.status(404).send({ message: "enrollment not found" });

    // 유저 권한 확인
    const season = await Season(req.user.academyId).findById(enrollment.season);
    if (!season) return res.status(404).send({ message: "season not found" });

    const registration = await Registration(req.user.academyId).findOne({
      season: enrollment.season,
      userId: req.user.userId,
    });
    if (!registration)
      return res.status(404).send({ message: "registration not found" });

    if (
      !season.checkPermission("evaluation", req.user.userId, registration.role)
    )
      return res.status(409).send({ message: "you have no permission" });

    const enrollmentsByTerm = await Enrollment(req.user.academyId)
      .find({
        _id: { $ne: enrollment._id },
        season: enrollment.season,
        studentId: enrollment.studentId,
        subject: enrollment.subject,
      })
      .select("+evaluation");

    const enrollmentsByYear = await Enrollment(req.user.academyId)
      .find({
        _id: { $ne: enrollment._id },
        school: enrollment.school,
        year: enrollment.year,
        studentId: enrollment.studentId,
        subject: enrollment.subject,
      })
      .select("+evaluation");

    //by mentor
    if (
      req.query.by === "mentor" &&
      _.find(enrollment.teachers, { userId: req.user.userId })
    ) {
      for (let label in req.body.new) {
        const obj = _.find(season.formEvaluation, { label });
        if (obj.auth.edit.teacher) {
          enrollment.evaluation = {
            ...enrollment.evaluation,
            [label]: req.body.new[label],
          };
          if (obj.combineBy === "term") {
            for (let e of enrollmentsByTerm) {
              e.evaluation = { ...e.evaluation, [label]: req.body.new[label] };
            }
          } else {
            for (let e of enrollmentsByYear)
              e.evaluation = { ...e.evaluation, [label]: req.body.new[label] };
          }
        }
      }
    }
    if (
      req.query.by === "student" &&
      enrollment.studentId === req.user.userId
    ) {
      for (let label in req.body.new) {
        const obj = _.find(season.formEvaluation, { label });
        if (obj.auth.edit.student) {
          enrollment.evaluation = {
            ...enrollment.evaluation,
            [label]: req.body.new[label],
          };
          if (obj.combineBy === "term") {
            for (let e of enrollmentsByTerm)
              e.evaluation = { ...e.evaluation, [label]: req.body.new[label] };
          } else {
            for (let e of enrollmentsByYear)
              e.evaluation = { ...e.evaluation, [label]: req.body.new[label] };
          }
        }
      }
    }

    /* save documents */
    await Promise.all([
      [enrollment, ...enrollmentsByTerm, ...enrollmentsByYear].forEach((e) =>
        e.save()
      ),
    ]);

    return res.status(200).send({
      enrollment,
    });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

module.exports.remove = async (req, res) => {
  try {
    const enrollment = await Enrollment(req.user.academyId).findById(
      req.params._id
    );

    if (!enrollment)
      return res.status(404).send({ message: "enrollment not found" });

    if (req.user.auth === "member" && enrollment.studentId != req.user.userId)
      return res.status(401).send();

    // 유저 권한 확인

    const registration = await Registration(req.user.academyId).findOne({
      season: enrollment.season,
      userId: enrollment.studentId,
    });
    if (!registration) {
      return res.status(404).send({ message: "등록 정보를 찾을 수 없습니다." });
    }

    const season = await Season(req.user.academyId).findById(enrollment.season);
    if (!season) return res.status(404).send({ message: "season not found" });
    console.log("permissionEnrollment: ", season.permissionEnrollment);
    console.log("registration is ", registration);
    if (
      !season.checkPermission(
        "enrollment",
        registration.userId,
        registration.role
      )
    )
      return res.status(401).send({ message: "you have no permission" });

    await enrollment.remove();
    return res.status(200).send();
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};
