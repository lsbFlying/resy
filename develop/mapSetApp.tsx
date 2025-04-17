import React, {
  useEffect,
} from "react";
import { defineStore } from "../src";

const infoObj = {
  personInfo: {
    ageInfo: {
      age: 12,
      level: "teen",
    },
    nameInfo: {
      name: "Liu-Shan-Bao",
    },
    bodyInfo: {
      heightInfo: new Map(Object.entries({
        height: 170,
        reach: 170,
      })),
      weightInfo: {
        weight: 64,
        level: "bantamweight",
      },
    },
  },
  nationality: "China",
};

// 定义 personInfo 的类型
type PersonInfo = {
  ageInfo: {
    age: number;
    level: string;
  };
  nameInfo: {
    name: string;
  };
  bodyInfo: {
    heightInfo: Map<"height" | "reach", number>;
    weightInfo: {
      weight: number;
      level: string;
    };
  };
};

type Nationality = string;

const useStore = defineStore({
  infoMap: new Map<"personInfo" | "nationality", PersonInfo | Nationality>(Object.entries(infoObj) as any),
  updateInfoMap() {
    // console.log((this.infoMap.get("personInfo") as PersonInfo)?.bodyInfo.weightInfo.weight);
    // (this.infoMap.get("personInfo") as PersonInfo)!.bodyInfo.heightInfo.reach = Math.floor(Math.random() * 1000);
    // this.infoMap.clear();
    (this.infoMap.get("personInfo") as PersonInfo)!.bodyInfo.heightInfo.clear();
  },
}, {
  immutable: true,
});

const App = () => {
  const { infoMap, updateInfoMap } = useStore();
  const nationality = infoMap.get("nationality") as string;
  const personInfo = infoMap.get("personInfo");
  const { ageInfo, nameInfo, bodyInfo } = personInfo as PersonInfo ?? {};
  const { age, level: ageLevel } = ageInfo ?? {};
  const { name } = nameInfo ?? {};
  const { heightInfo, weightInfo } = bodyInfo ?? {};
  // const { height, reach } = heightInfo ?? {};
  const height = heightInfo?.get("height");
  const reach = heightInfo?.get("reach");
  const { weight, level: weightLevel } = weightInfo ?? {};

  useEffect(() => {
    console.log("infoMap");
  }, [infoMap]);
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
      <button onClick={updateInfoMap}>updateInfoMap</button>
    </>
  );
};

export default App;
