import { anthropicClient, streamA2UI } from '@react-native-a2ui/llm';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  A2UIProvider,
  basicCatalog,
  type ClientMessage,
  createA2uiEngine,
  Surface,
} from 'react-native-a2ui';
import { SYSTEM_PROMPT } from './catalog';
import { FIXTURES, type FixtureStream, surfaceIdOf } from './fixtures';

// Public env var (Expo inlines EXPO_PUBLIC_*); empty when none is set. Never committed — the key
// is entered at runtime in the dev-only field below or supplied via the environment.
declare const process: { env: Record<string, string | undefined> };
const ENV_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

// Preset chunk delays (ms) for the streaming simulation.
const DELAYS = [0, 150, 400, 800];

/** Two screens: the fixture gallery (M1-T8) and the live-model chat demo (M2-T5). */
export default function App() {
  const [tab, setTab] = useState<'chat' | 'gallery'>('chat');
  return (
    <View style={styles.root}>
      <View style={styles.tabBar}>
        {(['chat', 'gallery'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, t === tab && styles.tabOn]}
          >
            <Text style={[styles.tabText, t === tab && styles.tabTextOn]}>
              {t === 'chat' ? 'Live chat' : 'Fixture gallery'}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === 'chat' ? <ChatScreen /> : <Gallery />}
      <StatusBar style="auto" />
    </View>
  );
}

/** Fixture gallery: pick an official stream and replay it through the real renderer pipeline. */
function Gallery() {
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

/**
 * Live chat: a prompt feeds a real model's token stream through `streamA2UI` into the engine,
 * rendering native UI as it arrives. Typing "book me a table" streams a booking form.
 */
function ChatScreen() {
  const [engine] = useState(createA2uiEngine);
  // ponytail: single Anthropic client (claude-opus-4-8). Swap for openaiClient/geminiClient in
  // one line if a provider toggle is ever needed — deliberately no picker UI for the demo.
  const [apiKey, setApiKey] = useState(ENV_API_KEY);
  const [prompt, setPrompt] = useState('');
  const [surfaceId, setSurfaceId] = useState<string | undefined>();
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The model picks the surfaceId in createSurface; render whichever it created last.
  useEffect(() => engine.subscribeSurfaces((ids) => setSurfaceId(ids[ids.length - 1])), [engine]);

  const send = useCallback(async () => {
    const text = prompt.trim();
    if (!text || !apiKey || streaming) return;
    setError(null);
    setStreaming(true);
    try {
      await streamA2UI({
        client: anthropicClient({ apiKey }),
        prompt: text,
        engine,
        system: SYSTEM_PROMPT,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStreaming(false);
    }
  }, [prompt, apiKey, streaming, engine]);

  return (
    <View style={styles.screen}>
      {ENV_API_KEY ? null : (
        <TextInput
          style={styles.keyInput}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Anthropic API key (dev only, not saved)"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
      )}
      <View style={styles.composer}>
        <TextInput
          style={styles.promptInput}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Ask for UI, e.g. book me a table"
          placeholderTextColor="#999"
          editable={!streaming}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable
          onPress={send}
          disabled={streaming || !prompt.trim() || !apiKey}
          style={[styles.sendBtn, (streaming || !prompt.trim() || !apiKey) && styles.sendBtnOff]}
        >
          {streaming ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendBtnText}>Send</Text>
          )}
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ScrollView style={styles.surface} contentContainerStyle={styles.surfaceBody}>
        {surfaceId ? (
          <A2UIProvider engine={engine} registry={basicCatalog}>
            <Surface surfaceId={surfaceId} />
          </A2UIProvider>
        ) : (
          <Text style={styles.note}>
            {apiKey ? 'Send a prompt to stream native UI here.' : 'Enter an API key to begin.'}
          </Text>
        )}
      </ScrollView>
    </View>
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
  root: { flex: 1, backgroundColor: '#fff' },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 52,
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#f0f0f0' },
  tabOn: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#333' },
  tabTextOn: { color: '#fff' },

  keyInput: {
    marginHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  composer: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 10 },
  promptInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    minWidth: 64,
    alignItems: 'center',
  },
  sendBtnOff: { backgroundColor: '#9db8f0' },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  error: { color: '#b91c1c', fontSize: 12, paddingHorizontal: 12, paddingTop: 8 },

  screen: { flex: 1, backgroundColor: '#fff', paddingTop: 8 },
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
