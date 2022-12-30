/**
 * @file Season Page Tab Item - Subjects
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
import { useState, useEffect, useRef } from "react";
import useDatabase from "hooks/useDatabase";

import style from "style/pages/admin/schools.module.scss";

// components
import Button from "components/button/Button";
import Input from "components/input/Input";
import Table from "components/table/Table";

import _ from "lodash";

type Props = {
  academy: string;
  seasonData: any;
};

type subjectDataListType = {
  [key: string]: string;
};

const Subjects = (props: Props) => {
  const database = useDatabase();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /* subject label list */
  const [subjectLabelList, setSubjectLabelList] = useState<string[]>(
    props.seasonData.subjects?.label || []
  );
  const subjectLabelRef = useRef<string>("");

  /* subject data list */
  const [subjectDataList, setSubjectDataList] = useState<any>();
  const subjectDataRef = useRef<string>("");

  /* subject data header list */
  const [subjectDataHeader, setSubjectDataHeader] = useState<any>([]);

  const updateSubjectDataList = () => {
    const subjectDataList = [];
    for (let i = 0; i < props.seasonData.subjects?.data.length; i++) {
      let data: subjectDataListType = {};
      for (let j = 0; j < props.seasonData.subjects?.data[i].length; j++) {
        data[subjectLabelList[j]] = props.seasonData.subjects?.data[i][j];
      }
      subjectDataList.push(data);
    }
    setSubjectDataList(subjectDataList);
  };

  const updateSubjectDataHeader = () => {
    const subjectDataList = [];
    for (let j = 0; j < subjectLabelList.length; j++) {
      subjectDataList.push({
        text: subjectLabelList[j],
        key: subjectLabelList[j],
        type: "string",
      });
    }
    setSubjectDataHeader(subjectDataList);
  };

  async function updateSubjects() {
    const result = await database.U({
      location: `academies/${props.academy}/seasons/${props.seasonData?._id}/subjects`,
      data: {
        new: {
          label: subjectLabelList,
          data: subjectDataList.map((data: any) => {
            const _data = [];
            for (let i = 0; i < subjectLabelList.length; i++) {
              _data.push(data[subjectLabelList[i]]);
            }
            return _data;
          }),
        },
      },
    });
    return result;
  }

  useEffect(() => {
    if (isLoading) {
      updateSubjectDataList();
      updateSubjectDataHeader();
      setIsLoading(false);
    }
    return () => {};
  }, [isLoading]);

  return (
    <div className={style.popup}>
      <div className={style.title} style={{ marginTop: "24px" }}>
        헤더 수정하기
      </div>

      <div className={style.row}>
        <Input
          style={{ minHeight: "30px" }}
          onChange={(e: any) => {
            subjectLabelRef.current = e.target.value;
          }}
          appearence={"flat"}
          placeholder="ex) 교과/과목"
          onKeyDown={(e: any) => {
            if (subjectLabelRef.current !== "" && e.key === "Enter") {
              const _subjectLabel = subjectLabelRef.current.split("/");
              setSubjectLabelList(_subjectLabel);
              updateSubjectDataHeader();
              setIsLoading(true);
              // e.target.value = "";
              // subjectLabelRef.current = "";
            }
          }}
        />

        <Button
          type={"ghost"}
          onClick={() => {
            const _subjectLabel = subjectLabelRef.current.split("/");
            setSubjectLabelList(_subjectLabel);
            updateSubjectDataHeader();
            setIsLoading(true);
          }}
          style={{
            borderRadius: "4px",
            height: "32px",
            boxShadow: "rgba(0, 0, 0, 0.1) 0px 1px 2px 0px",
          }}
        >
          추가
        </Button>
      </div>

      <div className={style.title} style={{ marginTop: "24px" }}>
        항목 추가하기
      </div>

      <div className={style.row}>
        <Input
          style={{ minHeight: "30px" }}
          onChange={(e: any) => {
            subjectDataRef.current = e.target.value;
          }}
          appearence={"flat"}
          placeholder={"ex) 미술/서양미술사"}
          onKeyDown={(e: any) => {
            if (subjectDataRef.current !== "" && e.key === "Enter") {
              const _subjectData = subjectDataRef.current.split("/");
              let data: subjectDataListType = {};
              for (let j = 0; j < subjectLabelList.length; j++) {
                data[subjectLabelList[j]] = _subjectData[j];
              }
              setSubjectDataList([...subjectDataList, data]);
              // e.target.value = "";
              // subjectDataRef.current = "";
            }
          }}
        />

        <Button
          type={"ghost"}
          onClick={() => {
            const _subjectData = subjectDataRef.current.split("/");
            let data: subjectDataListType = {};
            for (let j = 0; j < subjectLabelList.length; j++) {
              data[subjectLabelList[j]] = _subjectData[j];
            }
            setSubjectDataList([...subjectDataList, data]);
          }}
          style={{
            borderRadius: "4px",
            height: "32px",
            boxShadow: "rgba(0, 0, 0, 0.1) 0px 1px 2px 0px",
          }}
        >
          추가
        </Button>
      </div>

      <div style={{ marginTop: "24px" }} />
      <Table
        type="object-array"
        data={!isLoading ? subjectDataList : []}
        header={[
          {
            text: "ID",
            key: "",
            type: "index",
            width: "48px",
            align: "center",
          },
          ...subjectDataHeader,
          {
            text: "삭제",
            key: "index",
            type: "button",
            onClick: (e: any) => {
              subjectDataList.splice(
                _.findIndex(subjectDataList, (x) => _.isEqual(x, e)),
                1
              );
              setSubjectDataList([...subjectDataList]);
            },
            width: "80px",
            align: "center",
            textStyle: {
              padding: "0 10px",
              border: "var(--border-default)",
              background: "rgba(255, 200, 200, 0.25)",
              borderColor: "rgba(255, 200, 200)",
            },
          },
        ]}
      />

      <Button
        type={"ghost"}
        style={{
          borderRadius: "4px",
          height: "32px",
          margin: "24px 0",
          boxShadow: "rgba(0, 0, 0, 0.1) 0px 1px 2px 0px",
        }}
        onClick={() => {
          updateSubjects()
            .then(() => {
              alert("success");
            })
            .catch((err) => {
              alert(err.response.data.message);
            });
        }}
      >
        수정하기
      </Button>
    </div>
  );
};

export default Subjects;