import React, {
  useEffect,
} from "react";
import { defineStore } from "../src";

const useStore = defineStore({
  info: {
    personInfo: {
      ageInfo: {
        age: 12,
        level: "teen",
      },
      nameInfo: {
        name: "Liu-Shan-Bao",
      },
      bodyInfo: {
        heightInfo: {
          height: 170,
          reach: 170,
        },
        weightInfo: {
          weight: 64,
          level: "bantamweight",
        },
      },
    },
    nationality: "China",
  },
  updateInfo() {
    // this.info.nationality = `China-${Math.floor(Math.random() * 10000)}`;
    this.info.personInfo.bodyInfo.heightInfo.reach = Math.floor(Math.random() * 1000);
  },
}, {
  immutable: true,
});

const App = () => {
  const { info, updateInfo } = useStore();
  const { nationality, personInfo } = info;
  const { ageInfo, nameInfo, bodyInfo } = personInfo;
  const { age, level: ageLevel } = ageInfo;
  const { name } = nameInfo;
  const { heightInfo, weightInfo } = bodyInfo;
  const { height, reach } = heightInfo;
  const { weight, level: weightLevel } = weightInfo;

  useEffect(() => {
    console.log("info");
  }, [info]);
  useEffect(() => {
    console.log("personInfo");
  }, [personInfo]);
  useEffect(() => {
    console.log("ageInfo");
  }, [ageInfo]);
  useEffect(() => {
    console.log("nameInfo");
  }, [nameInfo]);
  useEffect(() => {
    console.log("bodyInfo");
  }, [bodyInfo]);
  useEffect(() => {
    console.log("heightInfo");
  }, [heightInfo]);
  useEffect(() => {
    console.log("weightInfo");
  }, [weightInfo]);

  return (
    <>
      <p>nationality:{nationality}</p>
      <p>age:{age}</p>
      <p>age-level:{ageLevel}</p>
      <p>name:{name}</p>
      <p>height:{height}</p>
      <p>reach:{reach}</p>
      <p>weight:{weight}</p>
      <p>weight-level:{weightLevel}</p>
      <button onClick={updateInfo}>updateInfo</button>
    </>
  );
};

export default App;
