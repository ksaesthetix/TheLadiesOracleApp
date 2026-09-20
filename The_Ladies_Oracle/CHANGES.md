# The Ladies' Oracle — UI restyle

A visual-only refresh: warm & elegant direction (burgundy / gold / cream to match the fan logo),
Playfair Display + Inter typography, and a light/dark theme that follows the device setting.
**No functionality was changed** — every route, fetch call, Firebase read/write, alert, handler
and piece of state is exactly as it was. Only the JSX/styles around them are new.

## 1. Install

From the `The_Ladies_Oracle` folder:

```bash
npx expo install @expo-google-fonts/inter @expo-google-fonts/playfair-display
npx expo start -c        # -c clears the Metro cache so the new fonts/assets are picked up
```

(`package.json` in this zip already lists both packages; the command above just installs them.)

## 2. What to copy

Copy everything in this zip over your `The_Ladies_Oracle` folder. The tree mirrors yours:

```
app/
  _layout.tsx                 restyled  (fonts loaded here; auth redirect logic unchanged)
  login.tsx                   restyled
  signup.tsx                  restyled
  dateofbirth.tsx             restyled
  edit_profile.tsx            restyled
  profile.tsx                 restyled
  questionselector.tsx        restyled
  iconselector.tsx            restyled
  answerpage.tsx              restyled
  locationdetails.tsx         restyled
  (tabs)/_layout.tsx          restyled  (tab bar theme; auth redirect logic unchanged)
  (tabs)/index.tsx            restyled
  (tabs)/friends.tsx          restyled
  (tabs)/profile.tsx          restyled
  (tabs)/questionselector.tsx restyled
  (tabs)/settings.tsx         restyled
  contexts/AuthContext.tsx            UNCHANGED (included for completeness)
  contexts/WisdomArchiveContext.tsx   UNCHANGED (included for completeness)

components/ui/                NEW — reusable themed components
  AppText, Avatar, Button, Card, Chip, IconBubble, InfoRow, ListRow,
  LoadingView, Logo, PageHeader, Screen, TextField, index.ts

constants/theme.ts            NEW — design tokens (light + dark palettes, spacing, radius, type scale, fonts)
constants/styles.ts           REWRITTEN as a compatibility layer (see §4)
hooks/useTheme.ts             NEW — picks light/dark from the device appearance setting

assets/images/The_Ladies_Oracle_Logo_mark.png   NEW — tight crop of your logo for in-app use
assets/images/The_Ladies_Oracle_Logo.png        UNCHANGED copy (app.json icon/splash still point here)

app.json                      splash background colours now match the theme (#FBF7F2 light, #171015 dark)
package.json                  + @expo-google-fonts/inter, + @expo-google-fonts/playfair-display
firebaseConfig.ts             UNCHANGED (included for completeness)
```

Files **not** in this zip because you didn't share them: `app/index__.tsx`, `app/settings.tsx` (root),
`app-example/`. They will keep compiling — `constants/styles.ts` keeps every key they might use —
and will pick up the refreshed light-mode look automatically. If you want the root `app/settings.tsx`
fully restyled, copy `app/(tabs)/settings.tsx` over it and change the three `../../` imports to `../`.

## 3. How the theme works

* `constants/theme.ts` holds two palettes (`lightColors`, `darkColors`) with the same shape, plus
  `spacing`, `radius`, `typography` and `fonts`.
* `hooks/useTheme.ts` returns the active theme using React Native's `useColorScheme()`.
  `app.json` already has `"userInterfaceStyle": "automatic"`, so the app follows the phone's setting.
* Screens compose the components in `components/ui` (Screen, Card, Button, TextField…) which read
  the theme internally. Screen-specific layout lives in a local `StyleSheet` at the bottom of each file.
* `app/_layout.tsx` loads the eight font weights with `useFonts`, keeps the splash screen up until they
  are ready, and hands the palette to React Navigation (headers, tab bar, status bar).

To tweak the look, edit `constants/theme.ts` — colours, radii and type scale are all there.

## 4. Backwards compatibility (`constants/styles.ts`)

The old `globalStyles` / `COLORS` export is still there with **every original key**, so any screen that
still imports it compiles unchanged. Values were refreshed to the new light palette and fonts. The
restyled screens don't use it any more.

## 5. Small presentational touches you may notice

These don't change behaviour but are worth knowing about:

* **Header titles** — routes that had no `Stack.Screen` entry (`iconselector`, `answerpage`,
  `locationdetails`, `questionselector`, `profile`) showed their file names in the header. They now
  have proper titles ("Choose Your Icon", "The Oracle's Answer", …). Navigation is unchanged.
* **Login logo** — the remote `wilcity.com` sample logo is replaced by your real logo (`Logo` component).
* **Avatar fallback** — Edit Profile used a `via.placeholder.com` image when there is no photo; it now shows
  an initials avatar (from the display name) or a person icon. Tapping the avatar also opens the picker
  (same `pickImage` function as the "Change Picture" button).
* **Profile screens** show the user's photo (`photoURL` from the Firestore doc / auth user) in the header
  avatar when one exists — the same data the screen already fetched.
* **Login email field** now hints the email keyboard (`keyboardType="email-address"`, `autoCapitalize="none"`).
* **Forms** (login, signup, edit profile, location) push content up when the keyboard opens
  (`KeyboardAvoidingView` inside `Screen`).
* **Home → Daily Affirmation modal** — the "Close" button previously rendered white text on a light
  background (invisible); it is now a visible ghost button. Same `setModalVisible(false)` handler.
* **Question categories** scroll horizontally instead of wrapping.
* **Location error** text is shown under the input field instead of below the button.
* **Copy** — a few supporting lines were added/reworded (e.g. "Step 1 of 3", "Choose the question
  weighing on your mind."). Pure text; easy to change in each screen.

## 6. Intentionally left exactly as they were

* **Sign Up** inputs are not wired to state and the button only shows an alert — as before.
* **Settings → Dark Mode** switch is not connected to anything (the theme follows the *device* setting).
  If you later want an in-app override, `useTheme` is the single place to add it.
* **Settings → Privacy Policy / Help & Support** link to `./privacy` and `./help`, which don't exist yet.
* **Home** still shows Login / Sign Up buttons even when signed in.
* Duplicate routes (`app/profile.tsx` vs `app/(tabs)/profile.tsx`, same for `questionselector`) — both
  restyled, routing untouched.
* `(tabs)/friends.tsx` keeps the unused `setFriends` (pre-existing lint warning).

## 7. Verification performed

* `tsc --noEmit` — clean, apart from one **pre-existing** error in your unchanged `firebaseConfig.ts`
  (`getReactNativePersistence` is missing from Firebase v12's type definitions; it works at runtime under
  Metro's React Native resolution, which is why the app already runs).
* `eslint` (your `eslint.config.js`) — 0 errors.
* `npx expo export --platform android` — bundles successfully; the logo mark and exactly the eight font
  files used are included (the imports use per-weight subpaths so the other ~28 weights aren't shipped).
* A token-level diff of every restyled screen against the original confirmed all routes, `fetch` calls,
  Firestore/Auth calls, alerts, handlers and `useState` hooks are present one-for-one.

## 8. One thing unrelated to styling

`cmd comands.txt` contains a live MongoDB Atlas connection string with a password, and the Firebase
`google-services.json` / `GoogleService-Info.plist` include API keys. The Firebase keys are normal to ship
in a mobile app, but the MongoDB credentials shouldn't live in the repo — worth rotating that password and
moving the string to an untracked `.env`.
