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
