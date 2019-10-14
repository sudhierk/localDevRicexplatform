import React from "react";

const SortArrows = ({ name, selected, onClick }) => (
  <div className="requests__arrows requests__arrows">
    <div
      className={`requests__arrows requests__arrows__top requests__arrows__top${selected[name] === "asc" ? "--selected" : ""}`}
      onClick={() => onClick(name, "asc")}
    />
    <div
      className={`requests__arrows requests__arrows__bot requests__arrows__bot${selected[name] === "desc" ? "--selected" : ""}`}
      onClick={() => onClick(name, "desc")}
    />
  </div>
);

export default SortArrows;
