import React from "react";

 type NotUserFoundProps = { 
 title: string;
  desc: string;
 }
const NotUserFound:React.FC<NotUserFoundProps> = ({title , desc}) => {
  return (
     <div className="card bg-base-200 p-6 text-center">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-base-content opacity-70">
        {desc}
      </p>
    </div>
  )
}

export default NotUserFound
