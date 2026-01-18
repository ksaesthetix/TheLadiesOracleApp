/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#865456'; // rose-500
const tintColorDark = '#ebe2d3';  // primary-500

export const Colors = {
  light: {
    text: '#5a4632',           // brown-500
    background: '#ebe2d3',     // primary-500
    tint: tintColorLight,
    icon: '#ae9263',           // gold-500
    tabIconDefault: '#ae9263', // gold-500
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ebe2d3',           // primary-500
    background: '#3a2121',     // rose-900
    tint: tintColorDark,
    icon: '#ae9263',           // gold-500
    tabIconDefault: '#ae9263', // gold-500
    tabIconSelected: tintColorDark,
  },
};
