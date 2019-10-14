import React from "react";

const SortArrowsTrade = ({ name = "", selected = {"": ""}, onClick }) => (
  <div className="trades__arrows">
    <div
      className={`trades__arrows trades__arrows__top trades__arrows__top${selected[name] === "asc" ? "--selected" : ""}`}
      onClick={() => onClick(name, "asc")}
    />
    <div
      className={`trades__arrows trades__arrows__bot trades__arrows__bot${selected[name] === "desc" ? "--selected" : ""}`}
      onClick={() => onClick(name, "desc")}
    />
  </div>
);

export default SortArrowsTrade;
