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
      // heightInfo: new Map(Object.entries({
      //   height: 170,
      //   reach: {
      //     value: 170
      //   },
      // })),
      heightInfo: {
        height: 170,
        reach: {
          value: 170
        },
      },
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
    // heightInfo: Map<"height" | "reach", number | { value: number }>;
    heightInfo: {
      height: number;
      reach: {
        value: number;
      },
    };
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
    // (this.infoMap.get("personInfo") as PersonInfo)!.bodyInfo.heightInfo.reach.value = Math.random();
    // (this.infoMap.get("personInfo") as PersonInfo)!.bodyInfo.heightInfo.reach.value = 170;
    // (this.infoMap.get("personInfo") as PersonInfo)!.bodyInfo.heightInfo = {
    //   height: Math.random(),
    //   reach: {
    //     value: Math.random(),
    //   },
    // };
    console.log(this.infoMap.get("personInfo"));
    (this.infoMap.set("personInfo", {
      ...infoObj.personInfo,
      bodyInfo: {
        ...infoObj.personInfo.bodyInfo,
        heightInfo: {
          ...infoObj.personInfo.bodyInfo.heightInfo,
          reach: {
            value: Math.random(),
            // value: 170,
          },
        },
      }
    }));
    console.log(this.infoMap.get("personInfo"));
    // console.log(this.infoMap);
    // this.infoMap.clear();
    // (this.infoMap.get("personInfo") as PersonInfo)!.bodyInfo.heightInfo.clear();
    // this.infoMap.delete("nationality");
    // (this.infoMap.get("personInfo") as PersonInfo)!.bodyInfo.heightInfo.delete("reach");
    // console.log(1, (
    //   (
    //     this.infoMap.get("personInfo") as PersonInfo
    //   )!.bodyInfo.heightInfo as Map<"height" | "reach", number>
    // ).get("reach"));
    // (
    //   (
    //     (
    //       this.infoMap.get("personInfo") as PersonInfo
    //     )!.bodyInfo.heightInfo as Map<"height" | "reach", number>
    //   ).get("reach") as { value: number } | undefined
    // )!.value = Math.floor(Math.random() * 1000);
    // (
    //   (
    //     this.infoMap.get("personInfo") as PersonInfo
    //   )!.bodyInfo.heightInfo as Map<"height" | "reach", number>
    // ).delete("reach");
    // (
    //   (
    //     this.infoMap.get("personInfo") as PersonInfo
    //   )!.bodyInfo.heightInfo as Map<"height" | "reach", number | { value: number }>
    // ).set("reach", { value: 987 });
    // this.infoMap.forEach((value, key, map) => {
    //   console.log(value, key, map);
    // });
    // const values = this.infoMap.entries();
    // const a = values.next();
    // (a.value as any[])[1].bodyInfo.weightInfo.weight = 999;
    // console.log(values.next());
    // for (const [key, value] of this.infoMap) {
    //   // console.log(key, value);
    //   if (typeof value === "object") {
    //     // ((value as PersonInfo).bodyInfo.heightInfo.get("reach") as { value: number }).value = 3453;
    //     (value as PersonInfo).bodyInfo.heightInfo.reach.value = Math.random();
    //     // console.log((value as PersonInfo).bodyInfo.heightInfo.reach.value);
    //   }
    // }
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
  const { height, reach } = heightInfo ?? {};
  // const height = heightInfo?.get("height") as number;
  // const reach = heightInfo?.get("reach") as { value: number };
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
      <p>reach:{reach?.value}</p>
      <p>weight:{weight}</p>
      <p>weight-level:{weightLevel}</p>
      <button onClick={updateInfoMap}>updateInfoMap</button>
    </>
  );
};

export default App;
