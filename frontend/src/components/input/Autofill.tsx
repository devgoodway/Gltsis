import React, { useRef, useState } from "react";
import style from "./input.module.scss";
type Props = {
  defaultValue?: string;
  label?: string;
  options: string[];
};

const Autofill = (props: Props) => {
  const [inputValue, setInputValue] = useState<string>(
    props.defaultValue ? props.defaultValue : ""
  );
  const [active, setActive] = useState<boolean>(false);
  const inputRef = useRef(null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column-reverse",
        marginTop: "24px",
        flex: "1 1 0",
        position: "relative",
      }}
    >
      <input
        type="text"
        ref={inputRef}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
        }}
        onFocus={() => {
          setActive(true);
        }}
        style={{
          fontSize: "14px",
          padding: "8px",
          outline: "none",
          border: "1px solid rgb(225,225,225)",
          width: "100%",
        }}
      />
      {props.label && (
        <label style={{ fontSize: "12px", paddingBottom: "6px" }}>
          {props.label}
        </label>
      )}
      {active && (
        <div className={style.options}>
          {props.options
            .filter((val: string) => {
              if (inputValue === "") {
                return val;
              } else if (val.toLowerCase().includes(inputValue.toLowerCase())) {
                return val;
              }
            })
            .map((value, index) => {
              return (
                <div
                  key={index}
                  onClick={() => {
                    setInputValue(value);
                    setActive(false);
                  }}
                  className={style.option}
                >
                  {value}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default Autofill;