import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { VERSION } from 'react-native-a2ui';

// Placeholder until M1-T8 (fixture gallery) and M2-T5 (live agent chat). See docs/ROADMAP.md.
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>react-native-a2ui</Text>
      <Text style={styles.subtitle}>example app · library v{VERSION}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});
