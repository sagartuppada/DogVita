declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  import { TextProps, TextStyle } from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class Icon extends Component<IconProps> {}
}
