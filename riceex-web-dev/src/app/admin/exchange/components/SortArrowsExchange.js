import React from "react";

const SortArrowsExchange = ({ name, selected, onClick }) => (
  <div className="exchange__arrows">
    <div
      className={`exchange__arrows exchange__arrows__top exchange__arrows__top${selected[name] === "asc" ? "--selected" : ""}`}
      onClick={() => onClick(name, "asc")}
    />
    <div
      className={`exchange__arrows exchange__arrows__bot exchange__arrows__bot${selected[name] === "desc" ? "--selected" : ""}`}
      onClick={() => onClick(name, "desc")}
    />
  </div>
);

export default SortArrowsExchange;
