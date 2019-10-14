import React from 'react';
import MdHome from "react-icons/lib/md/home";
import MdWeb from "react-icons/lib/md/web";
import IoDocumentText from "react-icons/lib/io/document";
import IoPieGraph from "react-icons/lib/io/pie-graph";
import './Sidenav.css';


export default () => (
  <aside className="sidenav d-none d-md-flex">
    <div className="item">
      <MdHome className="" />
    </div>
    <div className="item">
      <IoDocumentText className="" />
    </div>
    <div className="item active">
      <IoPieGraph className="graph-icn" />
    </div>
    <div className="item">
      <MdWeb className="" />
    </div>
  </aside>
);