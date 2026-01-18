import { StyleSheet } from 'react-native';

// Updated color palette for a more elegant, modern look
export const COLORS = {
  // Backgrounds
  background: '#f8f5f0',        // Soft off-white
  backgroundLight: '#fdfaf6',   // Lighter beige
  backgroundDark: '#b8a48a',    // Muted taupe

  // Primary (Deep Rose)
  primary: '#7c3a2f',           // Deep rose
  primaryLight: '#f8efef',      // Very light rose
  primaryDark: '#3a2121',       // Deep brown

  // Accent (Gold)
  accent: '#c9a86a',            // Warm gold
  accentLight: '#f9f5e9',       // Pale gold
  accentDark: '#7a5a2f',        // Deep gold

  // Secondary (Rich Brown)
  secondary: '#4e3629',         // Rich brown
  secondaryLight: '#ede6df',    // Soft brown
  secondaryDark: '#271d14',     // Very dark brown

  // Highlight (Rose-Pink)
  highlight: '#b97a7a',         // Muted rose-pink
  highlightLight: '#fbeeee',    // Very light pink
  highlightDark: '#452828',     // Deep rose

  white: '#fff',
  text: '#4e3629',              // Rich brown for text
  muted: '#b8a48a',             // Muted taupe for muted text
  border: '#c9a86a',            // Gold for borders
  headerBackgroundColor: '#ebe2d3', // Add this line for header backgrounds
  headerBackgroundColorDark: '#3a2121',

  // Aliases for convenience
  rose: '#7c3a2f',
  gold: '#c9a86a',
  brown: '#4e3629',
  hoverPink: '#b97a7a',
};

const globalStyles = StyleSheet.create({
  // Generic page container and text
  pageContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.background,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  pageText: {
    fontSize: 34,
    color: COLORS.text,
    textAlign: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    justifyContent: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    color: COLORS.text,
  },
  settingsText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 12,
  },
  aboutText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 12,
  },
  headerImage: {
    color: COLORS.secondary,
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 10,
  },
  reactLogo: {
    width: 820,
    maxWidth: '90%',
    height: undefined,
    aspectRatio: 620 / 300,
    //resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 16,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
    marginVertical: 16,
    gap: 12,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.secondary,
    marginBottom: 32,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 30,
    marginBottom: 0,
    elevation: 3,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  secondaryButton: {
    borderColor: COLORS.accent,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 30,
    backgroundColor: COLORS.backgroundLight,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    backgroundColor: COLORS.muted,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: 32,
  },
  editbutton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 30,
    marginBottom: 16,
  },
  logoutButton: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 30,
    backgroundColor: COLORS.background,
  },
  logoutText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 24,
    gap: 10,
  },
  iconSymbol: {
    fontSize: 20,
    color: COLORS.secondaryDark,
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: COLORS.accent,
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    backgroundColor: COLORS.accent,
  },
  selectBox: {
    borderWidth: 2,
    borderColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 22,
    paddingHorizontal: 28,
    marginVertical: 22,
    alignSelf: 'center',
    width: '92%',
    backgroundColor: COLORS.background,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  selectBoxText: {
    fontSize: 24,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'serif',
    letterSpacing: 0.5,
  },
  questionList: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 32,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: COLORS.accent,
    paddingVertical: 16,
    width: '92%',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginVertical: 4,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  questionNumber: {
    fontSize: 18,
    color: COLORS.highlight,
    width: 32,
    fontFamily: 'serif',
    fontWeight: '600',
    textAlign: 'right',
    marginRight: 8,
  },
  questionText: {
    fontSize: 18,
    color: COLORS.secondary,
    fontFamily: 'serif',
    flex: 1,
    paddingLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    width: '80%',
    elevation: 8,
  },
  quoteText: {
    fontSize: 20,
    color: COLORS.primary,
    fontStyle: 'italic',
    marginBottom: 24,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 12,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  closeButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  archiveContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 0,
  },
  archiveTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 18,
    textAlign: 'center',
  },
  archiveSubtitle: {
    fontSize: 18,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 32,
  },
  archiveScroll: {
    width: '100%',
    paddingHorizontal: 16,
  },
  archiveQuoteBox: {
    marginTop: 32,
    marginBottom: 18,
    padding: 18,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  archiveQuoteText: {
    fontSize: 20,
    color: COLORS.primary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  authInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    fontSize: 18,
    backgroundColor: COLORS.backgroundLight,
    color: COLORS.text,
    shadowColor: COLORS.accentLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  authLink: {
    color: COLORS.primary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 18,
  },
  authLinkBold: {
    fontWeight: 'bold',
    color: COLORS.accent,
  },
});

export default globalStyles;