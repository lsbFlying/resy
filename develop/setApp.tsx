import React, { useEffect } from "react";
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
      heightInfo: new Set().add({
        value: 170
      }),
      weightInfo: {
        weight: 64,
        level: "bantamweight",
      },
    },
  } as PersonInfo,
  nationality: "China" as Nationality,
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
    heightInfo: Set<{ value: number }>;
    weightInfo: {
      weight: number;
      level: string;
    };
  };
};

type Nationality = string;

const useStore = defineStore({
  infoSet: new Set<PersonInfo | Nationality | { newName: string }>().add(infoObj.personInfo).add(infoObj.nationality),
  updateInfoSet() {
    // this.infoSet.clear();
    // this.infoSet.delete(infoObj.nationality);
    // this.infoSet.delete(infoObj.personInfo);
    this.infoSet.add({ newName: "Liu" });
  },
}, {
  immutable: true,
});

const App = () => {
  const { infoSet, updateInfoSet } = useStore();
  const arrays = infoSet.values().toArray();
  const [personInfo, nationality, newInfo] = arrays.length === 1
    ? [undefined, arrays[0]]
    : arrays;

  const { newName } = (newInfo || {}) as { newName: string };

  const { ageInfo, nameInfo, bodyInfo } = personInfo as PersonInfo ?? {};
  const { age, level: ageLevel } = ageInfo ?? {};
  const { name } = nameInfo ?? {};
  const { heightInfo, weightInfo } = bodyInfo ?? {};
  const height = heightInfo ? Array.from(heightInfo)[0]?.value : 0;
  const { weight, level: weightLevel } = weightInfo ?? {};

  useEffect(() => {
    console.log("infoSet");
  }, [infoSet]);
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
      <p>newName:{newName}</p>
      <p>nationality:{nationality as Nationality}</p>
      <p>age:{age}</p>
      <p>age-level:{ageLevel}</p>
      <p>name:{name}</p>
      <p>height:{height}</p>
      <p>weight:{weight}</p>
      <p>weight-level:{weightLevel}</p>
      <button onClick={updateInfoSet}>updateInfoSet</button>
    </>
  );
};

export default App;
