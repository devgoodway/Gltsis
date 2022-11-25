/**
 * @file Academy Pid Page Tab Item - Season
 *
 * @author jessie129j <jessie129j@gmail.com>
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

import { useEffect, useState } from "react";
import useDatabase from "hooks/useDatabase";

// components
import Button from "components/button/Button";
import Input from "components/input/Input";
import Table from "components/table/Table";
import Tab from "components/tab/Tab";
import Popup from "components/popup/Popup";
import Select from "components/select/Select";

// tab elements
import Basic from "./tab/Basic";
import Classroom from "./tab/Classroom";
import Subject from "./tab/Subject";
import Permission from "./tab/Permission";
import Form from "./tab/Form";

import _ from "lodash";

type Props = {
  academy: string;
};

const Season = (props: Props) => {
  const database = useDatabase();
  const [isLoading, setIsLoading] = useState(false);

  /* document list */
  const [documentList, setDocumentList] = useState<any>();
  const [doc, setDoc] = useState<any>();

  /* additional document list */
  const [schoolList, setSchoolList] = useState<any>();
  const [school, setSchool] = useState<string>();

  /* popup activation */
  const [editPopupActive, setEditPopupActive] = useState(false);
  const [addPopupActive, setAddPopupActive] = useState<boolean>(false);

  /* document fields */
  const [schoolId, setSchoolId] = useState<string>("");
  const [schoolName, setSchoolName] = useState<string>("");
  const [year, setYear] = useState<string>();
  const [term, setTerm] = useState<string>();
  const [start, setStart] = useState<string>();
  const [end, setEnd] = useState<string>();

  async function getDocumentList() {
    const { documents } = await database.R({
      location: `academies/${props.academy}/seasons?school=${school}`,
    });
    return documents;
  }

  async function getDocument(id: string) {
    const result = await database.R({
      location: `academies/${props.academy}/seasons/${id}`,
    });
    return result;
  }

  async function getSchoolList() {
    const { documents } = await database.R({
      location: `academies/${props.academy}/schools`,
    });
    return documents;
  }

  async function addDocument() {
    const result = await database.C({
      location: `academies/${props.academy}/seasons`,
      data: {
        school,
        schoolId,
        schoolName,
        year,
        term,
        period: {
          start: start,
          end: end,
        },
      },
    });
    return result;
  }

  async function deleteDocument(id: string) {
    if (window.confirm("정말 삭제하시겠습니까?") === true) {
      const result = database.D({
        location: `academies/${props.academy}/seasons/${id}`,
      });
      return result;
    } else {
      return false;
    }
  }

  const schools = () => {
    let result: { text: string; value: string }[] = [{ text: "", value: "" }];

    for (let i = 0; i < schoolList?.length; i++) {
      result.push({
        text: `${schoolList[i].schoolName}(${schoolList[i].schoolId})`,
        value: schoolList[i]._id,
      });
    }

    return result;
  };

  const years = () => {
    let result: { text: string; value: number }[] = [];
    const date = new Date();
    const currentYear = date.getFullYear();

    for (let i = 2000; i < currentYear + 50; i++) {
      result.push({ text: i.toString(), value: i });
    }

    return result;
  };

  useEffect(() => {
    getSchoolList()
      .then((res) => {
        setSchoolList(res);
      })
      .catch(() => {
        alert("failed to load data");
      });
    setIsLoading(false);
    return () => {};
  }, []);

  useEffect(() => {
    if (!school) {
      setDocumentList([]);
    } else {
      getDocumentList()
        .then((res) => {
          setDocumentList(res);
        })
        .catch(() => {
          alert("failed to load data");
        });
    }
    setIsLoading(false);
    return () => {};
  }, [school]);

  return (
    <div style={{ marginTop: "24px" }}>
      <Select
        style={{ minHeight: "30px" }}
        required
        label={"학교 선택"}
        options={!isLoading ? schools() : []}
        setValue={setSchool}
        appearence={"flat"}
      />

      <Button
        type={"ghost"}
        style={{
          borderRadius: "4px",
          height: "32px",
          margin: "24px 0",
          boxShadow: "rgba(0, 0, 0, 0.1) 0px 1px 2px 0px",
        }}
        onClick={async () => {
          if (school) {
            const schoolDoc = _.find(schoolList, { _id: school });
            setSchoolId(schoolDoc.schoolId);
            setSchoolName(schoolDoc.schoolName);
            setAddPopupActive(true);
          }
        }}
      >
        + 시즌 생성
      </Button>
      <Table
      type="object-array"
        filter
        data={!isLoading ? documentList : []}
        header={[
          {
            text: "ID",
            key: "",
            type: "index",
            width: "48px",
            align: "center",
          },
          {
            text: "학교 ID",
            key: "schoolId",
            type: "string",
          },
          {
            text: "학교 이름",
            key: "schoolName",
            type: "string",
          },
          {
            text: "학년도",
            key: "year",
            type: "string",
          },
          {
            text: "학기",
            key: "term",
            type: "string",
          },
          {
            text: "자세히",
            key: "_id",
            type: "button",
            onClick: (e: any) => {
              getDocument(e.target.dataset.value).then((res) => {
                setDoc(res);
                setEditPopupActive(true);
              });
            },
            width: "80px",
            align: "center",
          },
          {
            text: "삭제",
            key: "_id",
            type: "button",
            onClick: (e: any) => {
              deleteDocument(e.target.dataset.value)
                .then(() => {
                  getDocumentList().then((res) => {
                    setDocumentList(res);
                    setAddPopupActive(false);
                    alert("success");
                  });
                })
                .catch((err) => {
                  alert(err.response.data.message);
                });
            },
            width: "80px",
            align: "center",
          },
        ]}
      />
      {editPopupActive && (
        <Popup
          closeBtn
          title="Edit Document"
          setState={setEditPopupActive}
          style={{ borderRadius: "8px", maxWidth: "1000px", width: "100%" }}
          contentScroll
        >
          <Tab
            dontUsePaths
            items={{
              "기본 정보": <Basic academy={props.academy} seasonData={doc} />,
              classrooms: (
                <Classroom academy={props.academy} seasonData={doc} />
              ),
              subjects: <Subject academy={props.academy} seasonData={doc} />,
              permissions: (
                <Permission academy={props.academy} seasonData={doc} />
              ),
              forms: <Form academy={props.academy} seasonData={doc} />,
            }}
            align={"flex-start"}
          />
        </Popup>
      )}
      {addPopupActive && (
        <Popup
          setState={setAddPopupActive}
          style={{ borderRadius: "8px", maxWidth: "1000px", width: "100%" }}
          closeBtn
          title={"Creaet Document"}
        >
          <div style={{ display: "flex", gap: "24px", marginTop: "24px" }}>
            <Input
              appearence="flat"
              label="학교 ID"
              required={true}
              disabled={true}
              defaultValue={schoolId}
            />
            <Input
              appearence="flat"
              label="학교 이름"
              required={true}
              disabled={true}
              defaultValue={schoolName}
            />
          </div>

          <div style={{ display: "flex", gap: "24px", marginTop: "24px" }}>
            <Select
              style={{ minHeight: "30px" }}
              label="학년도"
              defaultSelectedValue={new Date().getFullYear()}
              required
              options={years()}
              setValue={setYear}
              appearence={"flat"}
            />
          </div>
          <div style={{ display: "flex", gap: "24px", marginTop: "24px" }}>
            <Input
              appearence="flat"
              label="term"
              required={true}
              onChange={(e: any) => {
                setTerm(e.target.value);
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "24px", marginTop: "24px" }}>
            <Input
              appearence="flat"
              label="period.start"
              type="date"
              required={true}
              onChange={(e: any) => {
                setStart(e.target.value);
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "24px", marginTop: "24px" }}>
            <Input
              appearence="flat"
              label="period.end"
              type="date"
              required={true}
              onChange={(e: any) => {
                setEnd(e.target.value);
              }}
            />
          </div>
          <Button
            type={"ghost"}
            onClick={() => {
              addDocument()
                .then(() => {
                  getDocumentList().then((res) => {
                    setDocumentList(res);
                    setAddPopupActive(false);
                    alert("success");
                  });
                })
                .catch((err) => {
                  alert(err.response.data.message);
                });
            }}
            style={{
              borderRadius: "4px",
              height: "32px",
              boxShadow: "rgba(0, 0, 0, 0.1) 0px 1px 2px 0px",
              marginTop: "24px",
            }}
          >
            생성
          </Button>
        </Popup>
      )}
    </div>
  );
};

export default Season;
