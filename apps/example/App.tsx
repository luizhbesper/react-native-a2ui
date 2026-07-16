import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  A2UIProvider,
  basicCatalog,
  type ClientMessage,
  createA2uiEngine,
  Surface,
} from 'react-native-a2ui';
import { FIXTURES, type FixtureStream, surfaceIdOf } from './fixtures';

// Preset chunk delays (ms) for the streaming simulation.
const DELAYS = [0, 150, 400, 800];

/** Fixture gallery: pick an official stream and replay it through the real renderer pipeline. */
export default function App() {
  const [selected, setSelected] = useState<number | null>(null);
  const [delayMs, setDelayMs] = useState(400);
  const [nonce, setNonce] = useState(0);

  if (selected === null) {
    return <GalleryList onPick={setSelected} />;
  }
  return (
    <FixturePlayer
      // Remount (fresh engine + restarted stream) whenever the fixture, delay, or replay changes.
      key={`${selected}:${delayMs}:${nonce}`}
      fixture={FIXTURES[selected]}
      delayMs={delayMs}
      onBack={() => setSelected(null)}
      onReplay={() => setNonce((n) => n + 1)}
      onDelay={setDelayMs}
    />
  );
}

function GalleryList({ onPick }: { onPick: (index: number) => void }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.h1}>A2UI fixture gallery</Text>
      <Text style={styles.sub}>Pick an official stream to replay through the renderer.</Text>
      <ScrollView contentContainerStyle={styles.listBody}>
        {FIXTURES.map((f, i) => (
          <Pressable key={f.name} style={styles.card} onPress={() => onPick(i)}>
            <Text style={styles.cardTitle}>{f.name}</Text>
            <Text style={styles.cardDesc}>{f.description}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

function FixturePlayer({
  fixture,
  delayMs,
  onBack,
  onReplay,
  onDelay,
}: {
  fixture: FixtureStream;
  delayMs: number;
  onBack: () => void;
  onReplay: () => void;
  onDelay: (ms: number) => void;
}) {
  const [engine] = useState(createA2uiEngine);
  const surfaceId = useMemo(() => surfaceIdOf(fixture.messages), [fixture]);
  const [log, setLog] = useState<ClientMessage[]>([]);
  const [fed, setFed] = useState(0);
  const total = fixture.messages.length;

  // Debug panel: collect every outbound action/error the surface dispatches (newest first).
  useEffect(() => engine.onClientMessage((m) => setLog((prev) => [m, ...prev])), [engine]);

  // Simulate streaming: feed the stream's messages into the engine one at a time.
  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      engine.processMessages([fixture.messages[i]]);
      i += 1;
      setFed(i);
      if (i < total) timer = setTimeout(step, delayMs);
    };
    step();
    return () => clearTimeout(timer);
  }, [engine, fixture, delayMs, total]);

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {fixture.name}
        </Text>
        <Pressable onPress={onReplay} style={styles.navBtn}>
          <Text style={styles.navBtnText}>Replay ↻</Text>
        </Pressable>
      </View>

      <View style={styles.delayRow}>
        <Text style={styles.delayLabel}>Chunk delay</Text>
        {DELAYS.map((d) => (
          <Pressable
            key={d}
            onPress={() => onDelay(d)}
            style={[styles.chip, d === delayMs && styles.chipOn]}
          >
            <Text style={[styles.chipText, d === delayMs && styles.chipTextOn]}>{d}ms</Text>
          </Pressable>
        ))}
        <Text style={styles.progress}>
          {fed}/{total}
        </Text>
      </View>

      <ScrollView style={styles.surface} contentContainerStyle={styles.surfaceBody}>
        {surfaceId ? (
          <A2UIProvider engine={engine} registry={basicCatalog}>
            <Surface surfaceId={surfaceId} />
          </A2UIProvider>
        ) : (
          <Text style={styles.note}>This stream declares no surface.</Text>
        )}
      </ScrollView>

      <View style={styles.debug}>
        <Text style={styles.debugTitle}>Outbound actions ({log.length})</Text>
        <ScrollView style={styles.debugBody}>
          {log.length === 0 ? (
            <Text style={styles.debugEmpty}>None yet — interact with the surface.</Text>
          ) : (
            log.map((m, i) => (
              // Append-only log; index is a stable key.
              // biome-ignore lint/suspicious/noArrayIndexKey: log is append-only, order never changes
              <Text key={i} style={styles.debugLine}>
                {m.type === 'action'
                  ? `→ ${m.name}  ${JSON.stringify(m.context)}`
                  : `⚠ ${m.code}: ${m.message}`}
              </Text>
            ))
          )}
        </ScrollView>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', paddingTop: 52 },
  h1: { fontSize: 22, fontWeight: '700', paddingHorizontal: 16 },
  sub: { fontSize: 13, color: '#666', paddingHorizontal: 16, paddingBottom: 8 },
  listBody: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderColor: '#e2e2e2', borderRadius: 12, padding: 14, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardDesc: { fontSize: 13, color: '#666' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600' },
  navBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  navBtnText: { fontSize: 13, fontWeight: '600', color: '#333' },

  delayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  delayLabel: { fontSize: 12, color: '#666', marginRight: 2 },
  chip: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 14, backgroundColor: '#f0f0f0' },
  chipOn: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#333' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  progress: { marginLeft: 'auto', fontSize: 12, color: '#999' },

  surface: { flex: 1 },
  surfaceBody: { padding: 16 },
  note: { fontSize: 13, color: '#999' },

  debug: { maxHeight: 170, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#0b1020' },
  debugTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8ab4ff',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  debugBody: { paddingHorizontal: 12, paddingVertical: 6 },
  debugEmpty: { fontSize: 12, color: '#5b6479' },
  debugLine: { fontSize: 12, color: '#cdd6f4', fontFamily: 'monospace', paddingVertical: 2 },
});
