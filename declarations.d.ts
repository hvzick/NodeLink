declare module "*.svg" {
    import React from "react";
    import { SvgProps } from "react-native-svg";
    const content: React.FC<SvgProps>;
    export default content;
  }
declare module "react-native-crypto";
declare module "react-native-polyfill-globals";
declare module "qrcode" {
  const content: any;
  export default content;
}
declare module '@walletconnect/sign-client';
// react-native-vector-icons.d.ts
declare module 'react-native-vector-icons/MaterialIcons' {
  const content: any;
  export default content;
}
declare module 'base-64';