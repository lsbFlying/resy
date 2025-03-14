import React, {
  useEffect,
} from "react";
import { defineStore } from "../src";

interface Model {
  count: number;
  info: {
    ageIno: {
      age: number;
      innerInfo: {
        value: number;
        nameInfo: {
          name: string;
        };
      };
    };
    nameInfo: {
      name: string;
    };
  };
  userInfo: {
    username?: string;
  };
  list: {
    name: string;
    age: number;
  }[];
  // list: string[];
  map: Map<string, string>;
  increase(): void;
  updateInfo(): void;
  updateUserInfo(): void;
  updateList(): void;
  updateMap(): void;
}

const useStore = defineStore<Model>({
  count: 0,
  info: {
    ageIno: {
      age: 8,
      innerInfo: {
        value: 8,
        nameInfo: {
          name: "value",
        },
      }
    },
    nameInfo: {
      name: "Jack",
    },
  },
  userInfo: {
    username: "Liu",
  },
  list: [
    { name: "LIU", age: 27 },
    { name: "shan", age: 28 },
    { name: "Bao", age: 29 },
    { name: "xiao_bao", age: 29 },
  ],
  // list: Array(100).fill(e),
  // list: [
  //   "LIU",
  //   "shan",
  //   "Bao",
  //   "xiao_bao",
  // ],
  // list: [
  //   "LIU",
  //   "LIUw",
  //   "LIUc",
  //   "LIU",
  // ],
  map: new Map().set("name", "LIUSHANBAO"),
  increase() {
    this.count++;
  },
  updateInfo() {
    // this.info = {
    //   ...this.info,
    //   ageIno: {
    //     ...this.info.ageIno,
    //     innerInfo: {
    //       ...this.info.ageIno.innerInfo,
    //       nameInfo: {
    //         ...this.info.ageIno.innerInfo.nameInfo,
    //         name: "asd",
    //       },
    //     },
    //   },
    // };
    this.info.ageIno.innerInfo.nameInfo.name = "asd";
    // this.info.nameInfo.name = "Bob";
    // const { info } = this;
    // const { nameInfo } = info;
    // const { name } = nameInfo;
    // console.log("this(store)", info, nameInfo, name);
    // const value = this.info;
    // this.setState({
    //   info: {
    //     ...value,
    //     nameInfo: {
    //       name: "Bob"
    //     },
    //   },
    // });
  },
  updateUserInfo() {
    this.userInfo.username = "Hello";
  },
  updateList() {
    // this.list[0].name = "ok👌1";
    // this.list[1].name = "ok👌2";
    // this.list[2].name = "ok👌3";
    this.list.forEach((
      item,
      // index
    ) => {
      // console.log(item);
      // if (index === 0) {
      //   item.name = "ok👌";
      // }
      // item.name = "ok👌";
      item.name = `ok👌${Math.random() * 100}`;
      // console.log(item);
    });
    // this.list = this.list.map((
    //   item,
    //   // index
    // ) => {
    //   // console.log(item);
    //   // if (index === 0) {
    //   //   item.name = "ok👌";
    //   // }
    //   // item.name = "ok👌";
    //   // item.name = `ok👌${Math.random() * 100}`;
    //   // console.log(item);
    //   return {
    //     ...item,
    //     name: `ok👌${Math.random() * 100}`,
    //   };
    // });
    // console.log(this.list);
    // this.list[0].name = `ok👌${Math.random() * 100}`;
    // console.log(this.list.push(
    //   {
    //     name: "OK👌",
    //     age: 190,
    //   },
    //   // {
    //   //   name: "OK👌",
    //   //   age: 199,
    //   // },
    //   // {
    //   //   name: "OK👌",
    //   //   age: 677,
    //   // }
    // ));
    // console.log(this.list[2]);
    // console.log(this.list.pop());
    // console.log(this.list.fill({ name: `OK_OK_OK${Math.random() * 100}`, age: 999999 }));
    // console.time("test");
    // console.log(this.list.reverse());
    // console.timeEnd("test");
    // console.log(this.list.shift());
    // console.log(this.list.unshift(
    //   {
    //     name: "OK👌",
    //     age: 190,
    //   },
    //   {
    //     name: "OK👌",
    //     age: 199,
    //   },
    //   {
    //     name: "OK👌",
    //     age: 677,
    //   }
    // ));
    // console.log(this.list.splice(
    //   1,
    //   2,
    //   {
    //     name: "OK👌",
    //     age: 190,
    //   },
    //   {
    //     name: "OK👌",
    //     age: 199,
    //   },
    //   {
    //     name: "OK👌",
    //     age: 677,
    //   }
    // ));
    // for (const listElement of this.list) {
    //   console.log(listElement, this.list);
    //   listElement.name = `iterator_${Math.random() * 100}`;
    // }
    // this.list.sort((a, b) => {
    //   // console.log(a, b);
    //   // a.age = 99;
    //   return b.age - a.age;
    // });
    // this.list.sort();
    // console.log(this.list);
  },
  updateMap() {
    this.map.set("name", "SHAN_BAO_LIU");
  },
},
{ immutable: true },
);

const App = () => {
  const {
    count,
    info,
    // userInfo,
    list,
    // map,
    increase,
    updateInfo,
    // updateUserInfo,
    updateList,
    // updateMap,
  } = useStore();
  const { nameInfo, ageIno } = info;
  const { name } = nameInfo;
  const { age, innerInfo } = ageIno;
  const { nameInfo: innerInfoNameInfo, value } = innerInfo;
  const { name: innerName } = innerInfoNameInfo;
  // console.log("render(engine)", info, nameInfo, name);

  // const { username } = userInfo;

  // useEffect(() => {
  //   console.log(123123);
  // }, [nameInfo]);

  // useEffect(() => {
  //   console.log(123123);
  // }, [list]);

  useEffect(() => {
    console.log("info");
  }, [info]);
  useEffect(() => {
    console.log("ageIno");
  }, [ageIno]);
  useEffect(() => {
    console.log("innerInfo");
  }, [innerInfo]);
  useEffect(() => {
    console.log("innerInfoNameInfo");
  }, [innerInfoNameInfo]);

  return (
    <>
      <p>count:{count}</p>
      <button onClick={increase}>increase</button>
      <p>info-name:{name}</p>
      <p>info-age:{age}</p>
      <p>info-age-value:{value}</p>
      <p>info-name-inner-name:{innerName}</p>
      <button onClick={updateInfo}>updateInfo</button>
      {/* <p>user-info-name:{username}</p> */}
      {/* <button onClick={updateUserInfo}>updateUserInfo</button> */}
      <button onClick={updateList}>updateList</button>
      <div>list:{
        list.map((item, index) => {
          return (
            <p key={index} style={{ backgroundColor: "whitesmoke" }}>
              {item.name}-{item.age}
              {/* {item} */}
            </p>
          );
        })
      }</div>
      {/* <p>map-name:{map.get("name")}</p> */}
      {/* <button onClick={updateMap}>updateMap</button> */}
    </>
  );
};

export default App;
