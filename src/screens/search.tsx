import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Switch, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/chip';
import { ICONS, Icon } from '@/components/icon';
import { MechanicCard } from '@/components/mechanic-card';
import { StateMessage } from '@/components/state-message';
import { SERVICE_IDS, type ServiceId, serviceLabel } from '@/constants/services';
import { Radius, Spacing, useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import { useUserLocation } from '@/hooks/use-user-location';
import { fetchNearbyMechanics, type Mechanic } from '@/lib/mechanics';
import { getOpenState } from '@/utils/opening-hours';

const RADII_KM = [10, 30, 100, 300] as const;
type Sort = 'nearest' | 'open' | 'name';

type Filters = {
  query: string;
  service: ServiceId | null;
  openNow: boolean;
  verifiedOnly: boolean;
  radiusKm: (typeof RADII_KM)[number];
  sort: Sort;
};

const DEFAULT_FILTERS: Filters = { query: '', service: null, openNow: false, verifiedOnly: false, radiusKm: 30, sort: 'nearest' };

/** Advanced search: free text + service, open-now, verified, radius and sort. */
export function SearchScreen() {
  const c = useColors();
  const t = useStrings();
  const { coords, status: locationStatus } = useUserLocation();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [result, setResult] = useState<{ key: string; data: Mechanic[]; error: boolean }>({ key: '', data: [], error: false });
  const [attempt, setAttempt] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const isDirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  // Server/demo query: position + radius + service. Everything else filters the result on the device.
  const lat = Math.round(coords.latitude * 1000) / 1000;
  const lng = Math.round(coords.longitude * 1000) / 1000;
  const isLocating = locationStatus === 'locating';
  const key = `${lat},${lng},${filters.radiusKm},${filters.service},${attempt}`;

  useEffect(() => {
    if (isLocating) return;
    let cancelled = false;
    fetchNearbyMechanics({ latitude: lat, longitude: lng, radiusKm: filters.radiusKm, service: filters.service })
      .then((data) => !cancelled && setResult({ key, data, error: false }))
      .catch(() => !cancelled && setResult((r) => ({ key, data: r.data, error: true })));
    return () => {
      cancelled = true;
    };
  }, [key, lat, lng, filters.radiusKm, filters.service, isLocating]);

  const loading = isLocating || result.key !== key;

  const matches = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const list = result.data.filter((m) => {
      if (q && ![m.name, m.address ?? '', m.province ?? ''].some((s) => s.toLowerCase().includes(q))) return false;
      if (filters.verifiedOnly && !m.is_verified) return false;
      if (filters.openNow && !['open', 'open24h'].includes(getOpenState(m))) return false;
      return true;
    });
    const isOpen = (m: Mechanic) => (['open', 'open24h'].includes(getOpenState(m)) ? 0 : 1);
    const byDistance = (a: Mechanic, b: Mechanic) => (a.distance_m ?? Infinity) - (b.distance_m ?? Infinity);
    if (filters.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'km'));
    else if (filters.sort === 'open') list.sort((a, b) => isOpen(a) - isOpen(b) || byDistance(a, b));
    else list.sort(byDistance);
    return list;
  }, [result.data, filters.query, filters.verifiedOnly, filters.openNow, filters.sort]);

  const sortLabels: Record<Sort, string> = { nearest: t.sortNearest, open: t.sortOpen, name: t.sortName };

  const activeCount = [filters.openNow, filters.verifiedOnly, filters.radiusKm !== DEFAULT_FILTERS.radiusKm, filters.sort !== DEFAULT_FILTERS.sort].filter(Boolean).length;

  // Rendered as a sticky list header, so the filters stay put while the mechanics scroll underneath.
  const header = (
    <View style={{ gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            minHeight: 50,
            paddingHorizontal: Spacing.md,
            borderRadius: Radius.md,
            borderCurve: 'continuous',
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.border,
          }}>
          <Icon {...ICONS.search} size={18} color={c.tertiaryLabel} />
          <TextInput
            value={filters.query}
            onChangeText={(query) => update({ query })}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={c.tertiaryLabel}
            selectionColor={c.accent}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel={t.search}
            style={{ flex: 1, fontSize: 16, color: c.label, paddingVertical: 10 }}
          />
        </View>
        <Pressable
          onPress={() => setShowAdvanced((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={t.advancedSearch}
          accessibilityState={{ expanded: showAdvanced }}
          style={({ pressed }) => ({
            width: 50,
            height: 50,
            borderRadius: Radius.md,
            borderCurve: 'continuous',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: showAdvanced || activeCount > 0 ? c.accent : c.card,
            borderWidth: 1,
            borderColor: showAdvanced || activeCount > 0 ? c.accent : c.border,
            opacity: pressed ? 0.8 : 1,
          })}>
          <Icon {...ICONS.filter} size={20} color={showAdvanced || activeCount > 0 ? c.onFill : c.accent} />
          {activeCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                minWidth: 20,
                height: 20,
                paddingHorizontal: 5,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: c.primary,
                borderWidth: 2,
                borderColor: c.background,
              }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: c.onFill }}>{activeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        <Chip label={t.allServices} selected={filters.service === null} onPress={() => update({ service: null })} />
        {SERVICE_IDS.map((id) => (
          <Chip key={id} label={serviceLabel(id, t)} selected={filters.service === id} onPress={() => update({ service: id })} />
        ))}
      </View>

      {showAdvanced && (
        <View
          style={{
            gap: Spacing.lg,
            padding: Spacing.lg,
            borderRadius: Radius.lg,
            borderCurve: 'continuous',
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.border,
          }}>
          <FilterGroup title={t.distance}>
            {RADII_KM.map((km) => (
              <Chip key={km} label={t.withinKm(km)} selected={filters.radiusKm === km} onPress={() => update({ radiusKm: km })} />
            ))}
          </FilterGroup>
          <FilterGroup title={t.sortBy}>
            {(Object.keys(sortLabels) as Sort[]).map((sort) => (
              <Chip key={sort} label={sortLabels[sort]} selected={filters.sort === sort} onPress={() => update({ sort })} />
            ))}
          </FilterGroup>
          <View>
            <ToggleRow icon={ICONS.clock} label={t.openNowOnly} value={filters.openNow} onChange={(openNow) => update({ openNow })} />
            <ToggleRow icon={ICONS.verified} label={t.verifiedOnly} value={filters.verifiedOnly} onChange={(verifiedOnly) => update({ verifiedOnly })} last />
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xs }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: c.secondaryLabel }}>
          {loading ? (isLocating ? t.findingLocation : t.loadingMechanics) : t.resultsCount(matches.length)}
        </Text>
        {isDirty && (
          <Pressable onPress={() => setFilters(DEFAULT_FILTERS)} accessibilityRole="button" hitSlop={8}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: c.accent }}>{t.clearFilters}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing.xxl * 2 }}
      stickyHeaderIndices={[0]}
      data={loading ? [] : matches}
      keyExtractor={(m) => m.id}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={{ paddingTop: Spacing.lg, paddingHorizontal: Spacing.xl }}>
          {loading ? (
            <StateMessage loading title={isLocating ? t.findingLocation : t.loadingMechanics} />
          ) : result.error ? (
            <StateMessage title={t.loadError} action={{ label: t.retry, onPress: () => setAttempt((a) => a + 1) }} />
          ) : (
            <StateMessage title={t.noResults} body={t.noneNearbyHint} action={{ label: t.tabAdd, onPress: () => router.navigate('/add') }} />
          )}
        </View>
      }
      renderItem={({ item }) => (
        <MechanicCard
          mechanic={item}
          onPress={() => router.push({ pathname: '/mechanic/[id]', params: { id: item.id } })}
          style={{ marginHorizontal: Spacing.lg }}
        />
      )}
    />
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: c.secondaryLabel, paddingHorizontal: Spacing.xs }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>{children}</View>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onChange,
  last = false,
}: {
  icon: (typeof ICONS)[keyof typeof ICONS];
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}) {
  const c = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        minHeight: 54,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.border,
      }}>
      <Icon {...icon} size={18} color={c.accent} />
      <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: c.label }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: c.accent }} />
    </View>
  );
}
