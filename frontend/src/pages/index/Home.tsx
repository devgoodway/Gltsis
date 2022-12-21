/**
 * @file Home Page
 *
 * @author seedlessapple <luminousseedlessapple@gmail.com>
 *
 * -------------------------------------------------------
 *
 * IN PRODUCTION
 *
 * -------------------------------------------------------
 *
 * IN MAINTENANCE
 *
 * -------------------------------------------------------
 *
 * IN DEVELOPMENT
 *
 * -------------------------------------------------------
 *
 * DEPRECATED
 *
 * -------------------------------------------------------
 *
 * NOTES
 *
 * @version 1.0
 *
 */

import React, { useEffect, useRef, useState } from "react";
import style from "../../style/pages/home.module.scss";
import TimeTable from "../../components/timetable/TimeTable";
import Canvas from "../../components/canvas/Canvas";
import Calender from "../../components/calender/Calender";
import QuickSearch from "../../components/quickSearch/QuickSearch";
import Navbar from "../../layout/navbar/Navbar";
import Schedule from "components/schedule/Schedule";
import useDatabase from "hooks/useDatabase";
import { useAuth } from "contexts/authContext";
import useGenerateId from "hooks/useGenerateId";
import useApi from "hooks/useApi";

const Home = () => {
  const database = useDatabase();
  const { EnrollmentApi } = useApi();
  const idGen = useGenerateId;

  const { currentSeason, currentUser } = useAuth();
  const [enrollments, setEnrollments] = useState<any>();

  function enrollmentsToEvents(data: any[]) {
    if (data) {
      let result: any[] = [];
      for (let i = 0; i < data.length; i++) {
        const element = data[i];

        if (element?.time.length <= 1) {
          result.push({
            id: element._id + JSON.stringify(element?.time[0]),
            title: element.classTitle,
            startTime: element?.time[0].start,
            endTime: element?.time[0].end,
            day: element?.time[0].day,
          });
        } else {
          for (let ii = 0; ii < element?.time.length; ii++) {
            const time = element?.time[ii];
            result.push({
              id: element._id + JSON.stringify(time),
              title: element.classTitle,
              startTime: time.start,
              endTime: time.end,
              day: time.day,
            });
          }
        }
      }
      return result;
    }
  }
  useEffect(() => {
    EnrollmentApi.REnrolllments({
      season: currentSeason?._id,
      studentId: currentUser.userId,
    })
      .then((res) => {
        setEnrollments(res);
        console.log(res);
      })
      .catch(() => {});
  }, [currentSeason]);

  return (
    <>
      <QuickSearch />
      <Navbar />
      <div className={style.section}>
        <Schedule
          defaultEvents={enrollmentsToEvents(enrollments)}
          title={`${currentSeason?.year??""} ${currentSeason?.term ??""} 일정`}
        />
      </div>
    </>
  );
};

export default Home;
