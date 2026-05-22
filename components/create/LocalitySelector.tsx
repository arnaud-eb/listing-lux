'use client'

import { useId, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  Check,
  ChevronsUpDown,
  X as XIcon,
} from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/lib/hooks/use-is-mobile'
import { pickLocalized } from '@/lib/localities/locale'
import type { LocalityOption } from '@/lib/localities/types'
import { isHouseType } from '@/lib/localities/types'
import type { Language } from '@/lib/types'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface LocalitySelectorProps {
  value: string
  onChange: (slug: string) => void
  /** Pre-fetched server-side dropdown options. Raw nameLocalized so cmdk can
   *  match across all locales (an EN agent typing 'Diekirch' still hits the DE
   *  spelling). */
  options: LocalityOption[]
  sqm: number
  propertyType: string
}

type OptionWithSearch = LocalityOption & { _search: string }

function normalize(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

type GroupKey = 'luxembourgVille' | 'eschSurAlzette' | 'communes'

const GROUP_ORDER: GroupKey[] = ['luxembourgVille', 'eschSurAlzette', 'communes']

function groupOf(o: LocalityOption): GroupKey {
  if (o.kind === 'quartier' || o.kind === 'sub_quartier') {
    if (o.parent.slug === 'luxembourg-city') return 'luxembourgVille'
    if (o.parent.slug === 'esch-sur-alzette') return 'eschSurAlzette'
    return 'communes'
  }
  return 'communes'
}

export default function LocalitySelector({
  value,
  onChange,
  options,
  sqm,
  propertyType,
}: LocalitySelectorProps) {
  const t = useTranslations('wizard.locality')
  const localeStr = useLocale()
  const locale: Language = localeStr === 'fr' || localeStr === 'en' || localeStr === 'de'
    ? localeStr
    : 'fr'
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const triggerId = useId()
  const liveId = useId()

  const optionsWithSearch = useMemo<OptionWithSearch[]>(
    () =>
      options.map((o) => ({
        ...o,
        _search: normalize(
          [
            ...Object.values(o.nameLocalized),
            ...Object.values(o.parent?.nameLocalized ?? {}),
          ]
            .filter((v): v is string => !!v)
            .join(' '),
        ),
      })),
    [options],
  )

  const optionsBySlug = useMemo(
    () => new Map(optionsWithSearch.map((o) => [o.slug, o])),
    [optionsWithSearch],
  )

  const grouped = useMemo(() => {
    const buckets: Record<GroupKey, OptionWithSearch[]> = {
      luxembourgVille: [],
      eschSurAlzette: [],
      communes: [],
    }
    for (const o of optionsWithSearch) {
      buckets[groupOf(o)].push(o)
    }
    for (const k of GROUP_ORDER) {
      buckets[k].sort((a, b) =>
        pickLocalized(a.nameLocalized, locale, a.slug).localeCompare(
          pickLocalized(b.nameLocalized, locale, b.slug),
        ),
      )
    }
    return buckets
  }, [optionsWithSearch, locale])

  const selected = value ? optionsBySlug.get(value) : null
  const selectedName = selected
    ? pickLocalized(selected.nameLocalized, locale, selected.slug)
    : ''

  const priceBand = selected?.price
    ? isHouseType(propertyType)
      ? selected.price.house
      : selected.price.apartment
    : null
  const estimate =
    priceBand && sqm > 0 ? Math.round(priceBand.medianPerSqm * sqm) : null

  function handlePick(slug: string) {
    onChange(slug)
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  // cmdk filter — needle normalized once per keystroke; haystacks pre-computed
  // in optionsWithSearch above (zero string ops per option per keystroke).
  const filter = (cmdValue: string, search: string) => {
    const o = optionsBySlug.get(cmdValue)
    if (!o) return 0
    return o._search.includes(normalize(search)) ? 1 : 0
  }

  const trigger = (
    <Button
      id={triggerId}
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      aria-controls={liveId}
      className={cn(
        'w-full h-11 justify-between border-gray-300 bg-white shadow-none font-normal',
        !selected && 'text-muted-foreground',
      )}
    >
      <span className="truncate">
        {selected ? selectedName : t('placeholder')}
      </span>
      <span className="flex items-center gap-1 shrink-0">
        {selected && (
          <span
            role="button"
            tabIndex={-1}
            onMouseDown={handleClear}
            aria-label={t('clearSelection')}
            className="text-gray-400 hover:text-navy-deep transition-colors -mr-1 p-0.5 rounded-sm"
          >
            <XIcon className="size-3.5" />
          </span>
        )}
        <ChevronsUpDown className="size-4 opacity-50" />
      </span>
    </Button>
  )

  const body = (
    <Command filter={filter}>
      <CommandInput placeholder={t('searchPlaceholder')} />
      <CommandList className="max-h-[60vh] md:max-h-[320px]">
        <CommandEmpty>{t('empty')}</CommandEmpty>
        {selected && (
          <CommandGroup>
            <CommandItem
              value="__clear__"
              onSelect={() => handlePick('')}
              className="h-11 md:h-9 text-gray-500"
            >
              <XIcon className="size-4" />
              {t('clearSelection')}
            </CommandItem>
          </CommandGroup>
        )}
        {GROUP_ORDER.map((groupKey) => {
          const items = grouped[groupKey]
          if (items.length === 0) return null
          return (
            <CommandGroup key={groupKey} heading={t(`group.${groupKey}`)}>
              {items.map((o) => {
                const name = pickLocalized(o.nameLocalized, locale, o.slug)
                return (
                  <CommandItem
                    key={o.slug}
                    value={o.slug}
                    onSelect={() => handlePick(o.slug)}
                    className="h-11 md:h-9"
                  >
                    <Check
                      className={cn(
                        'size-4 text-gold',
                        value === o.slug ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="flex-1">{name}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )
        })}
      </CommandList>
      <span id={liveId} role="status" aria-live="polite" className="sr-only" />
    </Command>
  )

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={triggerId}
        className="text-sm font-medium text-gray-700"
      >
        {t('label')} <span className="text-red-400">*</span>
      </label>

      {isMobile ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
          <DialogContent className="p-0 gap-0 max-md:max-w-full">
            <DialogHeader className="px-4 py-3 border-b border-gray-100">
              <DialogTitle className="text-base font-medium">
                {t('label')}
              </DialogTitle>
            </DialogHeader>
            {body}
          </DialogContent>
        </Dialog>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent
            align="start"
            className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[640px]"
            sideOffset={4}
          >
            {body}
          </PopoverContent>
        </Popover>
      )}

      {selected && (
        <EstimateBadge
          source={priceBand?.source ?? null}
          estimate={estimate}
          dataAsOf={priceBand?.dataAsOf ?? null}
        />
      )}
    </div>
  )
}

function EstimateBadge({
  source,
  estimate,
  dataAsOf,
}: {
  source: 'statec' | 'override' | 'tier' | null
  estimate: number | null
  dataAsOf: string | null
}) {
  const t = useTranslations('wizard.locality')
  if (estimate == null || source == null) return null
  const year = dataAsOf?.slice(0, 4)
  return (
    <div className="flex items-center gap-2 mt-1 flex-wrap" aria-live="polite">
      <span className="text-xs text-gray-500">{t('estimatedValue')}</span>
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-md bg-gold/10 text-gold text-xs font-semibold"
        aria-label={t('ariaEstimate', { value: formatCurrency(estimate) })}
      >
        {t('averagePrefix')} {formatCurrency(estimate)}
      </span>
      {year && (source === 'tier' || source === 'statec') && (
        <span
          className="inline-flex items-center gap-1 text-2xs text-gray-500"
          aria-label={t('dataSourceAria', { year })}
        >
          {t('dataSource', { year })}
        </span>
      )}
    </div>
  )
}

