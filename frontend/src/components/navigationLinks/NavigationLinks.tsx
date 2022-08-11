import { useLocation, useNavigate } from "react-router-dom";
import { SidebarData } from "../../dummyData/SidebarData";

type Props = {};

const NavigationLinks = (props: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationArr = location.pathname.split("/").filter((x) => x !== "");

  return (
    <div style={{ fontSize: "12px",fontWeight:500,marginBottom: "18px", display: "flex" }}>
      {locationArr.map((value, index) => {
        let to = "";
        for (let i = 0; i < index + 1; i++) {
          to += `/${locationArr[i]}`;
        }

        return (
          <div key={index}>
            <span>&nbsp;/&nbsp;</span>
            <span
              style={{ cursor: "pointer" }}
              onClick={() => {
                navigate(to, { replace: true });
              }}
            >
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default NavigationLinks;