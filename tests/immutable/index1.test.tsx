import React, { useEffect } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { defineStore } from "../../src";

/** General use of defineStore */
test("immutable-pure-object", async () => {
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
    updateNationality() {
      this.info.nationality = "ChinaPro";
    },
    updateReach() {
      this.info.personInfo.bodyInfo.heightInfo.reach = 197;
    },
  }, {
    immutable: true,
  });

  let infoDepsEffectCounter = 0;
  let personInfoDepsEffectCounter = 0;
  let ageInfoDepsEffectCounter = 0;
  let nameInfoDepsEffectCounter = 0;
  let bodyInfoDepsEffectCounter = 0;
  let heightInfoDepsEffectCounter = 0;
  let weightInfoDepsEffectCounter = 0;

  const App = () => {
    const { info, updateNationality, updateReach } = useStore();
    const { nationality, personInfo } = info;
    const { ageInfo, nameInfo, bodyInfo } = personInfo;
    const { age, level: ageLevel } = ageInfo;
    const { name } = nameInfo;
    const { heightInfo, weightInfo } = bodyInfo;
    const { height, reach } = heightInfo;
    const { weight, level: weightLevel } = weightInfo;

    useEffect(() => {
      infoDepsEffectCounter++;
      console.log("info");
    }, [info]);
    useEffect(() => {
      personInfoDepsEffectCounter++;
      console.log("personInfo");
    }, [personInfo]);
    useEffect(() => {
      ageInfoDepsEffectCounter++;
      console.log("ageInfo");
    }, [ageInfo]);
    useEffect(() => {
      nameInfoDepsEffectCounter++;
      console.log("nameInfo");
    }, [nameInfo]);
    useEffect(() => {
      bodyInfoDepsEffectCounter++;
      console.log("bodyInfo");
    }, [bodyInfo]);
    useEffect(() => {
      heightInfoDepsEffectCounter++;
      console.log("heightInfo");
    }, [heightInfo]);
    useEffect(() => {
      weightInfoDepsEffectCounter++;
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
        <button onClick={updateNationality}>updateNationality</button>
        <button onClick={updateReach}>updateReach</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("updateNationality"));
  await waitFor(() => {
    getByText("nationality:ChinaPro");
    getByText("age:12");
    getByText("age-level:teen");
    getByText("name:Liu-Shan-Bao");
    getByText("height:170");
    getByText("reach:170");
    getByText("weight:64");
    getByText("weight-level:bantamweight");

    // Changing `nationality` clones `info` only; every nested branch below it
    // keeps its identity, so their effects must not rerun.
    expect(infoDepsEffectCounter).toBe(2);
    expect(personInfoDepsEffectCounter).toBe(1);
    expect(ageInfoDepsEffectCounter).toBe(1);
    expect(nameInfoDepsEffectCounter).toBe(1);
    expect(bodyInfoDepsEffectCounter).toBe(1);
    expect(heightInfoDepsEffectCounter).toBe(1);
    expect(weightInfoDepsEffectCounter).toBe(1);
  });

  fireEvent.click(getByText("updateReach"));
  await waitFor(() => {
    getByText("nationality:ChinaPro");
    getByText("age:12");
    getByText("age-level:teen");
    getByText("name:Liu-Shan-Bao");
    getByText("height:170");
    getByText("reach:197");
    getByText("weight:64");
    getByText("weight-level:bantamweight");

    // Changing `reach` clones info → personInfo → bodyInfo → heightInfo;
    // ageInfo, nameInfo and weightInfo are siblings off the path.
    expect(infoDepsEffectCounter).toBe(3);
    expect(personInfoDepsEffectCounter).toBe(2);
    expect(ageInfoDepsEffectCounter).toBe(1);
    expect(nameInfoDepsEffectCounter).toBe(1);
    expect(bodyInfoDepsEffectCounter).toBe(2);
    expect(heightInfoDepsEffectCounter).toBe(2);
    expect(weightInfoDepsEffectCounter).toBe(1);
  });
});
