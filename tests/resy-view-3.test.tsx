import React, { useState } from "react";
import { test } from "vitest";
import { createStore, useStore, MapStateToProps, view } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

test("resy-view-3", async () => {
  
  type LoginState = {
    userId: number;
    userName: string;
  };
  
  const loginStore = createStore<LoginState>({
    userId: 0,
    userName: "L",
  });
  
  type ThemeState = {
    theme: "dark" | "light",
  };
  
  const themeStore = createStore<ThemeState>({
    theme: "light",
  });
  
  type MultipleClassStateType = {
    loginState: LoginState,
    themeState: ThemeState,
  };
  
  type ClassComProps = {
    value: number;
  };
  
  class ClassCom extends React.PureComponent<MapStateToProps<MultipleClassStateType, ClassComProps>> {
    render() {
      const { value } = this.props;
      const { loginState: { userId, userName }, themeState: { theme } } = this.props.state;
      
      return (
        <div>
          <p>value:{value}</p>
          <p>name:{userName}</p>
          <p>id:{userId}</p>
          <p>theme:{theme}</p>
        </div>
      );
    }
  }
  
  const ClassComView = view<ClassComProps>(ClassCom, {
    stores: { loginState: loginStore, themeState: themeStore },
    equal: (next, prev) => {
      const { props: nextProps, state: nextState } = next;
      const { props: prevProps, state: prevState } = prev;
      return !(
        prevProps.value !== nextProps.value
        || JSON.stringify(prevState) !== JSON.stringify(nextState)
      );
    },
  });
  
  function Login() {
    const { userName } = useStore(loginStore);
    return (
      <div>login-userName:{userName}</div>
    );
  }
  
  function Theme() {
    const { theme } = useStore(themeStore);
    return (
      <div>Theme-style:{theme}</div>
    );
  }
  
  const App = () => {
    const [value, setValue] = useState(0);
    return (
      <>
        <Login/>
        <Theme/>
        <ClassComView value={value}/>
        <button onClick={() => {
          setValue(999);
        }}>btn1</button>
        <button onClick={() => {
          loginStore.userName = "Bao";
        }}>btn2</button>
        <button onClick={() => {
          themeStore.theme = "dark";
        }}>btn3</button>
      </>
    );
  };
  
  const { getByText } = render(<App/>);
  
  fireEvent.click(getByText("btn1"));
  await waitFor(() => {
    getByText("value:999");
  });
  
  fireEvent.click(getByText("btn2"));
  await waitFor(() => {
    getByText("name:Bao");
  });
  
  fireEvent.click(getByText("btn3"));
  await waitFor(() => {
    getByText("theme:dark");
  });
});
