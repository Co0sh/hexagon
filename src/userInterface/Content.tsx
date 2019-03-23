import React, { ComponentType, FunctionComponent, memo } from 'react';
import { View } from '../data/View';
import useStore from '../logic/useStore';
import MainMenu from './menu/MainMenu';
import Register from './menu/Register';
import Login from './menu/Login';

type Routes = { [key in View]?: ComponentType };

/* eslint-disable @typescript-eslint/no-explicit-any */
const routes: Routes = {
  mainMenu: MainMenu as any,
  login: Login as any,
  register: Register as any,
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const Content: FunctionComponent = (): JSX.Element => {
  const route = useStore(s => s.route.current);
  const Component = routes[route];

  if (!Component) {
    return <div />;
  }

  return <Component />;
};

export default memo(Content);