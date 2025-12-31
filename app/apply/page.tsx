"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Authenticated,
  Unauthenticated,
  useQuery,
  useMutation,
} from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Share2,
  Wrench,
  ImageIcon,
  MessageSquare,
  Target,
  Loader2,
  CheckCircle2,
  Clock,
  Instagram,
  Youtube,
  X,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { Country, State, ICountry, IState } from "country-state-city";
import { ImageUploader } from "@/components/image-uploader";
import { Id } from "@/convex/_generated/dataModel";

// Get all countries from library
const allCountries = Country.getAllCountries();

// Months for birthday picker
const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

// Generate days 1-31
const days = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

// Generate years (current year - 13 down to current year - 100)
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 88 }, (_, i) => ({
  value: String(currentYear - 13 - i),
  label: String(currentYear - 13 - i),
}));

// Calculate age from birthday
function calculateAge(
  month: string,
  day: string,
  year: string
): number | null {
  if (!month || !day || !year) return null;

  const birthDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day)
  );
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

// LEGO themes for combobox
const legoThemes = [
  "Architecture",
  "Castle",
  "City",
  "Creator",
  "Fantasy",
  "Historical",
  "Mecha",
  "Military",
  "Modular Buildings",
  "Nature",
  "Pirates",
  "Sci-Fi",
  "Space",
  "Steampunk",
  "Technic",
  "Trains",
  "Vehicles",
  "Western",
  "Other",
];

// Step configuration
const steps = [
  { id: 1, title: "About You", icon: User, shortTitle: "You" },
  { id: 2, title: "Social", icon: Share2, shortTitle: "Social" },
  { id: 3, title: "Experience", icon: Wrench, shortTitle: "Exp" },
  { id: 4, title: "Your Work", icon: ImageIcon, shortTitle: "Work" },
  { id: 5, title: "Deep Dive", icon: MessageSquare, shortTitle: "Q&A" },
  { id: 6, title: "Goals", icon: Target, shortTitle: "Goals" },
];

// Button group component for single select
function ButtonGroup({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { value: string; label: string; description?: string }[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all ${
            value === option.value
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <span className="font-medium">{option.label}</span>
          {option.description && (
            <span className="mt-1 text-xs text-muted-foreground">
              {option.description}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Number button group for selecting numbers
function NumberButtonGroup({
  options,
  value,
  onChange,
}: {
  options: number[];
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 font-medium transition-all ${
            value === option
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          {option === 5 ? "5+" : option}
        </button>
      ))}
    </div>
  );
}

// Custom slider component
function RatingSlider({
  value,
  onChange,
  min = 1,
  max = 10,
  labels,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  labels?: { min: string; max: string };
}) {
  const range = max - min + 1;
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-1">
        {Array.from({ length: range }, (_, i) => i + min).map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all ${
              value === num
                ? "scale-110 bg-primary text-primary-foreground shadow-lg"
                : value > num
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {labels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{labels.min}</span>
          <span>{labels.max}</span>
        </div>
      )}
    </div>
  );
}

// Activity level visual selector
function ActivitySelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const levels = [
    { value: 1, label: "Occasionally", description: "A few times a month" },
    { value: 2, label: "Sometimes", description: "Once a week" },
    { value: 3, label: "Regularly", description: "A few times a week" },
    { value: 4, label: "Often", description: "Almost daily" },
    { value: 5, label: "Very Active", description: "Daily engagement" },
  ];

  return (
    <div className="space-y-2">
      {levels.map((level) => (
        <button
          key={level.value}
          type="button"
          onClick={() => onChange(level.value)}
          className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
            value === level.value
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={`h-5 w-1.5 rounded-full transition-colors ${
                  i < level.value ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex-1">
            <span className="font-medium">{level.label}</span>
            <p className="text-xs text-muted-foreground">{level.description}</p>
          </div>
          {value === level.value && <Check className="h-5 w-5 text-primary" />}
        </button>
      ))}
    </div>
  );
}


// Yes/No toggle
function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 rounded-xl border-2 py-3 font-medium transition-all ${
          !value
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border hover:border-primary/50"
        }`}
      >
        No
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 rounded-xl border-2 py-3 font-medium transition-all ${
          value
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border hover:border-primary/50"
        }`}
      >
        Yes
      </button>
    </div>
  );
}

// Progress Step component - Mobile optimized
function ProgressStep({
  step,
  currentStep,
  onClick,
  isLast,
  isMobile,
}: {
  step: { id: number; title: string; shortTitle: string; icon: React.ElementType };
  currentStep: number;
  onClick: () => void;
  isLast: boolean;
  isMobile: boolean;
}) {
  const isCompleted = step.id < currentStep;
  const isCurrent = step.id === currentStep;
  const isDisabled = step.id > currentStep;

  return (
    <div className="flex items-center">
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`flex flex-col items-center gap-1 md:gap-2 ${
          isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
        }`}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all md:h-10 md:w-10 ${
            isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : isCurrent
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted-foreground/30 text-muted-foreground"
          }`}
        >
          {isCompleted ? (
            <Check className="h-4 w-4 md:h-5 md:w-5" />
          ) : (
            <step.icon className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </div>
        <span
          className={`text-[10px] font-medium md:text-xs ${
            isCurrent ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {isMobile ? step.shortTitle : step.title}
        </span>
      </button>
      {!isLast && (
        <div
          className={`mx-1 h-0.5 w-4 rounded-full md:mx-2 md:w-8 lg:w-12 ${
            isCompleted ? "bg-primary" : "bg-muted-foreground/20"
          }`}
        />
      )}
    </div>
  );
}

// Country Combobox using country-state-city library
function CountryCombobox({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (country: ICountry) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedCountry = allCountries.find((c) => c.isoCode === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2"
          >
            {selectedCountry ? (
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-base">{selectedCountry.flag}</span>
                <span className="truncate">{selectedCountry.name}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Select country...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        }
      />
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {allCountries.map((country) => (
                <CommandItem
                  key={country.isoCode}
                  value={country.name}
                  onSelect={() => {
                    onValueChange(country);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="text-base">{country.flag}</span>
                  <span>{country.name}</span>
                  <Check
                    className={`ml-auto h-4 w-4 ${
                      value === country.isoCode ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// State/Province Combobox using country-state-city library
function StateCombobox({
  countryCode,
  value,
  onValueChange,
}: {
  countryCode: string;
  value: string;
  onValueChange: (state: IState) => void;
}) {
  const [open, setOpen] = useState(false);
  const states = useMemo(
    () => State.getStatesOfCountry(countryCode),
    [countryCode]
  );
  const selectedState = states.find((s) => s.isoCode === value);

  if (states.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2"
          >
            {selectedState ? (
              <span className="truncate">{selectedState.name}</span>
            ) : (
              <span className="text-muted-foreground">
                Select state/province...
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        }
      />
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search state/province..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {states.map((state) => (
                <CommandItem
                  key={state.isoCode}
                  value={state.name}
                  onSelect={() => {
                    onValueChange(state);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <span>{state.name}</span>
                  <Check
                    className={`ml-auto h-4 w-4 ${
                      value === state.isoCode ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Birthday Picker Component
function BirthdayPicker({
  month,
  day,
  year,
  onMonthChange,
  onDayChange,
  onYearChange,
}: {
  month: string;
  day: string;
  year: string;
  onMonthChange: (value: string) => void;
  onDayChange: (value: string) => void;
  onYearChange: (value: string) => void;
}) {
  const [monthOpen, setMonthOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  const selectedMonth = months.find((m) => m.value === month);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {/* Month */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Month</Label>
        <Popover open={monthOpen} onOpenChange={setMonthOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                role="combobox"
                aria-expanded={monthOpen}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2"
              >
                {selectedMonth ? (
                  <span className="truncate">{selectedMonth.label}</span>
                ) : (
                  <span className="text-muted-foreground">Month</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>
            }
          />
          <PopoverContent className="w-[180px] p-0" align="start">
            <Command>
              <CommandList className="max-h-[200px]">
                <CommandGroup>
                  {months.map((m) => (
                    <CommandItem
                      key={m.value}
                      value={m.label}
                      onSelect={() => {
                        onMonthChange(m.value);
                        setMonthOpen(false);
                      }}
                    >
                      {m.label}
                      <Check
                        className={`ml-auto h-4 w-4 ${
                          month === m.value ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Day */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Day</Label>
        <Popover open={dayOpen} onOpenChange={setDayOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                role="combobox"
                aria-expanded={dayOpen}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2"
              >
                {day ? (
                  <span>{day}</span>
                ) : (
                  <span className="text-muted-foreground">Day</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>
            }
          />
          <PopoverContent className="w-[120px] p-0" align="start">
            <Command>
              <CommandList className="max-h-[200px]">
                <CommandGroup>
                  {days.map((d) => (
                    <CommandItem
                      key={d.value}
                      value={d.label}
                      onSelect={() => {
                        onDayChange(d.value);
                        setDayOpen(false);
                      }}
                    >
                      {d.label}
                      <Check
                        className={`ml-auto h-4 w-4 ${
                          day === d.value ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Year */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Year</Label>
        <Popover open={yearOpen} onOpenChange={setYearOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                role="combobox"
                aria-expanded={yearOpen}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2"
              >
                {year ? (
                  <span>{year}</span>
                ) : (
                  <span className="text-muted-foreground">Year</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>
            }
          />
          <PopoverContent className="w-[120px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Year..." />
              <CommandList className="max-h-[200px]">
                <CommandEmpty>No year found.</CommandEmpty>
                <CommandGroup>
                  {years.map((y) => (
                    <CommandItem
                      key={y.value}
                      value={y.label}
                      onSelect={() => {
                        onYearChange(y.value);
                        setYearOpen(false);
                      }}
                    >
                      {y.label}
                      <Check
                        className={`ml-auto h-4 w-4 ${
                          year === y.value ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

// Theme Combobox Component
function ThemeCombobox({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2"
          >
            {value ? (
              <span className="truncate">{value}</span>
            ) : (
              <span className="text-muted-foreground">Select theme...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        }
      />
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search themes..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No theme found.</CommandEmpty>
            <CommandGroup>
              {legoThemes.map((theme) => (
                <CommandItem
                  key={theme}
                  value={theme}
                  onSelect={() => {
                    onValueChange(theme);
                    setOpen(false);
                  }}
                >
                  <span>{theme}</span>
                  <Check
                    className={`ml-auto h-4 w-4 ${
                      value === theme ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Form data type
interface FormData {
  // Step 1: About You
  birthMonth: string;
  birthDay: string;
  birthYear: string;
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  appliedBefore: boolean;
  previousApplications: number;

  // Step 2: Social Media
  instagramUsername: string;
  flickrUsername: string;
  youtubeChannel: string;
  youtubeExperience: string;
  otherSocialMedia: string;

  // Step 3: Building Experience
  yearsBuilding: string;
  selfRating: number;
  mocsPerMonth: number;
  mocSize: string;

  // Step 4: Your Work
  mocImageIds: Id<"_storage">[];
  activityLevel: number;

  // Step 5: Deep Dive
  aboutYourself: string;
  communityThrive: string;
  collaborationExample: string;
  handleDisagreements: string;
  buildStrengths: string;
  challengeOvercome: string;
  favoriteTheme: string;
  conventions: string;

  // Step 6: Goals
  communityMotivation: string;
  legoAmbitions: string;
  improvementArea: string;
  whyJoin: string;
  questionsForUs: string;
}

const initialFormData: FormData = {
  birthMonth: "",
  birthDay: "",
  birthYear: "",
  country: "",
  countryCode: "",
  state: "",
  stateCode: "",
  appliedBefore: false,
  previousApplications: 0,
  instagramUsername: "",
  flickrUsername: "",
  youtubeChannel: "",
  youtubeExperience: "",
  otherSocialMedia: "",
  yearsBuilding: "",
  selfRating: 5,
  mocsPerMonth: 1,
  mocSize: "",
  mocImageIds: [],
  activityLevel: 3,
  aboutYourself: "",
  communityThrive: "",
  collaborationExample: "",
  handleDisagreements: "",
  buildStrengths: "",
  challengeOvercome: "",
  favoriteTheme: "",
  conventions: "",
  communityMotivation: "",
  legoAmbitions: "",
  improvementArea: "",
  whyJoin: "",
  questionsForUs: "",
};

export default function ApplyPage() {
  const { signIn } = useAuthActions();
  const currentUser = useQuery(api.users.getCurrentUser);
  const canApplyResult = useQuery(api.applications.canUserApply);
  const applicationHistory = useQuery(api.applications.getMyApplicationHistory);
  const pendingApplication = useQuery(api.applications.getPendingApplication);
  const membershipStatus = useQuery(api.permissions.getAmIMember);
  const submitApplication = useMutation(api.applications.submitApplication);
  const savePendingApplication = useMutation(
    api.applications.savePendingApplication
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Check for mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load pending application ONCE on initial load
  useEffect(() => {
    if (pendingApplication && !hasLoadedInitial) {
      setFormData({
        birthMonth: pendingApplication.birthMonth ?? "",
        birthDay: pendingApplication.birthDay ?? "",
        birthYear: pendingApplication.birthYear ?? "",
        country: pendingApplication.country ?? "",
        countryCode: pendingApplication.countryCode ?? "",
        state: pendingApplication.state ?? "",
        stateCode: pendingApplication.stateCode ?? "",
        appliedBefore: pendingApplication.appliedBefore ?? false,
        previousApplications: pendingApplication.previousApplications ?? 0,
        instagramUsername: pendingApplication.instagramUsername ?? "",
        flickrUsername: pendingApplication.flickrUsername ?? "",
        youtubeChannel: pendingApplication.youtubeChannel ?? "",
        youtubeExperience: pendingApplication.youtubeExperience ?? "",
        otherSocialMedia: pendingApplication.otherSocialMedia ?? "",
        yearsBuilding: pendingApplication.yearsBuilding ?? "",
        selfRating: pendingApplication.selfRating ?? 5,
        mocsPerMonth: pendingApplication.mocsPerMonth ?? 1,
        mocSize: pendingApplication.mocSize ?? "",
        mocImageIds: pendingApplication.mocImageIds ?? [],
        activityLevel: pendingApplication.activityLevel ?? 3,
        aboutYourself: pendingApplication.aboutYourself ?? "",
        communityThrive: pendingApplication.communityThrive ?? "",
        collaborationExample: pendingApplication.collaborationExample ?? "",
        handleDisagreements: pendingApplication.handleDisagreements ?? "",
        buildStrengths: pendingApplication.buildStrengths ?? "",
        challengeOvercome: pendingApplication.challengeOvercome ?? "",
        favoriteTheme: pendingApplication.favoriteTheme ?? "",
        conventions: pendingApplication.conventions ?? "",
        communityMotivation: pendingApplication.communityMotivation ?? "",
        legoAmbitions: pendingApplication.legoAmbitions ?? "",
        improvementArea: pendingApplication.improvementArea ?? "",
        whyJoin: pendingApplication.whyJoin ?? "",
        questionsForUs: pendingApplication.questionsForUs ?? "",
      });
      if (pendingApplication.currentStep) {
        setCurrentStep(pendingApplication.currentStep);
      }
      setLastSaved(new Date(pendingApplication.lastUpdatedAt));
      setHasLoadedInitial(true);
    } else if (pendingApplication === null && !hasLoadedInitial) {
      // No pending application exists, mark as loaded
      setHasLoadedInitial(true);
    }
  }, [pendingApplication, hasLoadedInitial]);

  const updateFormData = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setIsDirty(true);
    },
    []
  );

  // Auto-save debounced - only when dirty
  const saveProgress = useCallback(async () => {
    if (!currentUser || !isDirty || !hasLoadedInitial) return;

    setIsSaving(true);
    try {
      await savePendingApplication({
        ...formData,
        currentStep,
      });
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to save progress:", error);
    } finally {
      setIsSaving(false);
    }
  }, [currentUser, formData, currentStep, savePendingApplication, isDirty, hasLoadedInitial]);

  // Auto-save when form is dirty (debounced - 3 seconds)
  useEffect(() => {
    if (!currentUser || !isDirty || !hasLoadedInitial) return;

    const timeoutId = setTimeout(() => {
      saveProgress();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, currentUser, saveProgress, isDirty, hasLoadedInitial]);

  // Also save when changing steps (immediate save on step change if dirty)
  useEffect(() => {
    if (isDirty && hasLoadedInitial && currentUser) {
      saveProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Get states for selected country
  const statesForCountry = useMemo(
    () => State.getStatesOfCountry(formData.countryCode),
    [formData.countryCode]
  );

  // Compute location string
  const getLocationString = useCallback(() => {
    if (!formData.country) return "";
    if (formData.state && statesForCountry.length > 0) {
      return `${formData.state}, ${formData.country}`;
    }
    return formData.country;
  }, [formData.country, formData.state, statesForCountry]);

  // Calculate age from birthday
  const age = calculateAge(
    formData.birthMonth,
    formData.birthDay,
    formData.birthYear
  );

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        const hasLocation =
          formData.country &&
          (statesForCountry.length === 0 || formData.state);
        const hasValidAge = age !== null && age >= 13;
        return hasValidAge && hasLocation;
      case 2:
        return true;
      case 3:
        return formData.yearsBuilding && formData.mocSize;
      case 4:
        return formData.mocImageIds.length >= 1;
      case 5:
        return (
          formData.aboutYourself.trim().length >= 20 &&
          formData.communityThrive.trim().length >= 20 &&
          formData.collaborationExample.trim().length >= 20 &&
          formData.handleDisagreements.trim().length >= 20 &&
          formData.buildStrengths.trim().length >= 10 &&
          formData.challengeOvercome.trim().length >= 20 &&
          formData.favoriteTheme.trim().length >= 2
        );
      case 6:
        return (
          formData.communityMotivation.trim().length >= 20 &&
          formData.legoAmbitions.trim().length >= 20 &&
          formData.improvementArea.trim().length >= 10 &&
          formData.whyJoin.trim().length >= 20
        );
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitApplication({
        age: age ?? 0,
        location: getLocationString(),
        appliedBefore: formData.appliedBefore,
        previousApplications: formData.previousApplications,
        instagramUsername: formData.instagramUsername,
        flickrUsername: formData.flickrUsername,
        youtubeChannel: formData.youtubeChannel,
        youtubeExperience: formData.youtubeExperience,
        otherSocialMedia: formData.otherSocialMedia,
        yearsBuilding: formData.yearsBuilding,
        selfRating: formData.selfRating,
        mocsPerMonth: formData.mocsPerMonth,
        mocSize: formData.mocSize,
        mocImageIds: formData.mocImageIds,
        activityLevel: formData.activityLevel,
        aboutYourself: formData.aboutYourself,
        communityThrive: formData.communityThrive,
        collaborationExample: formData.collaborationExample,
        handleDisagreements: formData.handleDisagreements,
        buildStrengths: formData.buildStrengths,
        challengeOvercome: formData.challengeOvercome,
        favoriteTheme: formData.favoriteTheme,
        conventions: formData.conventions,
        communityMotivation: formData.communityMotivation,
        legoAmbitions: formData.legoAmbitions,
        improvementArea: formData.improvementArea,
        whyJoin: formData.whyJoin,
        questionsForUs: formData.questionsForUs,
      });
      toast.success("Application submitted successfully!");
      // Refresh the page to show the success state
      window.location.reload();
    } catch (error) {
      console.error("Failed to submit application:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit application";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Application status component for authenticated users who cannot apply
  const ApplicationStatusSection = () => {
    const mostRecentApp = applicationHistory?.[0];
    
    return (
      <section className="mx-auto max-w-2xl px-6 py-20">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            {mostRecentApp?.status === "pending" || mostRecentApp?.status === "reviewing" ? (
              <Clock className="h-10 w-10 text-primary" />
            ) : mostRecentApp?.status === "accepted" ? (
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            ) : mostRecentApp?.status === "rejected" ? (
              <X className="h-10 w-10 text-destructive" />
            ) : (
              <Clock className="h-10 w-10 text-yellow-500" />
            )}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {mostRecentApp?.status === "pending" || mostRecentApp?.status === "reviewing"
              ? "Application Under Review"
              : mostRecentApp?.status === "accepted"
                ? "Welcome to BobaLUG!"
                : mostRecentApp?.status === "rejected"
                  ? "Application Not Accepted"
                  : "Application Status"}
          </h1>
          <p className="mt-4 text-muted-foreground">
            {canApplyResult?.reason}
          </p>
          {mostRecentApp && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <Badge
                variant={
                  mostRecentApp.status === "accepted"
                    ? "default"
                    : mostRecentApp.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
                className="text-sm capitalize"
              >
                {mostRecentApp.status === "reviewing" ? "Under Review" : mostRecentApp.status}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Submitted on{" "}
                {new Date(mostRecentApp.submittedAt).toLocaleDateString()}
              </p>
              {mostRecentApp.reviewedAt && (
                <p className="text-sm text-muted-foreground">
                  Reviewed on{" "}
                  {new Date(mostRecentApp.reviewedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
          
          {/* Application History */}
          {applicationHistory && applicationHistory.length > 1 && (
            <div className="mt-12">
              <h2 className="text-lg font-medium">Application History</h2>
              <div className="mt-4 space-y-3">
                {applicationHistory.map((app, index) => (
                  <div
                    key={app._id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 text-left"
                  >
                    <div>
                      <p className="font-medium">Application #{applicationHistory.length - index}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        app.status === "accepted"
                          ? "default"
                          : app.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                      className="capitalize"
                    >
                      {app.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link href="/">
            <Button variant="outline" className="mt-8">
              Back to Home
            </Button>
          </Link>
        </div>
      </section>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <Unauthenticated>
          <section className="mx-auto max-w-2xl px-6 py-20">
            <Card className="border-2">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    Sign In to Apply
                  </h1>
                  <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                    To apply for membership, please sign in with your Discord account. 
                    This helps us verify your identity and communicate with you during the review process.
                  </p>
                  
                  <div className="mt-8 space-y-4">
                    <Button
                      size="lg"
                      className="gap-2"
                      onClick={() => void signIn("discord")}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                      Sign In with Discord
                    </Button>
                    
                    <p className="text-xs text-muted-foreground">
                      Don&apos;t have a Discord account?{" "}
                      <a 
                        href="https://discord.com/register" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Create one for free
                      </a>
                    </p>
                  </div>
                  
                  <div className="relative my-6">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs font-medium text-muted-foreground">
                      Why Discord?
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-left">
                    <div className="grid gap-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>Our community communicates primarily through Discord</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>We&apos;ll notify you about your application status via Discord</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>It helps us verify that you&apos;re a real person</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </Unauthenticated>

        <Authenticated>
          {/* Show application status if user cannot apply */}
          {canApplyResult && !canApplyResult.canApply && (
            <ApplicationStatusSection />
          )}

          {/* Already a member - show message */}
          {canApplyResult?.canApply && membershipStatus?.isMember && (
            <section className="mx-auto max-w-4xl px-6 py-20">
              <div className="mx-auto max-w-md text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
                <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                  You&apos;re Already a Member!
                </h1>
                <p className="mt-2 text-muted-foreground">
                  You already have access to the BobaLUG community. No need to apply again!
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link href="/members">
                    <Button>View Members</Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="outline">Go to Profile</Button>
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Not a member and can apply - show application */}
          {canApplyResult?.canApply && !membershipStatus?.isMember && (
            <>
              {/* Page Header */}
              <section className="border-b border-border/40 bg-muted/20">
                <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
                  <Link
                    href="/"
                    className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Home
                  </Link>
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight md:text-2xl lg:text-3xl">
                      Apply to Join BobaLUG
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground md:mt-2 md:text-base">
                      {currentUser?.name && `Hi ${currentUser.name}! `}Complete
                      the application below.
                    </p>
                  </div>
                </div>
              </section>

          {/* Progress Steps */}
          <section className="border-b border-border/40 bg-background">
            <div className="mx-auto max-w-4xl overflow-x-auto px-4 py-4 md:px-6 md:py-6">
              <div className="flex justify-center">
                {steps.map((step, index) => (
                  <ProgressStep
                    key={step.id}
                    step={step}
                    currentStep={currentStep}
                    onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                    isLast={index === steps.length - 1}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Form Content */}
          <section className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
            {/* Step 1: About You */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    About You
                  </CardTitle>
                  <CardDescription>
                    Let&apos;s start with some basic information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <Label>When were you born?</Label>
                    <BirthdayPicker
                      month={formData.birthMonth}
                      day={formData.birthDay}
                      year={formData.birthYear}
                      onMonthChange={(value) =>
                        updateFormData("birthMonth", value)
                      }
                      onDayChange={(value) => updateFormData("birthDay", value)}
                      onYearChange={(value) =>
                        updateFormData("birthYear", value)
                      }
                    />
                    {age !== null && (
                      <p className="text-sm text-muted-foreground">
                        You are{" "}
                        <span className="font-medium text-foreground">
                          {age}
                        </span>{" "}
                        years old
                      </p>
                    )}
                    {age !== null && age < 13 && (
                      <p className="text-sm text-destructive">
                        You must be at least 13 years old to apply.
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Where are you from?</Label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Country
                        </Label>
                        <CountryCombobox
                          value={formData.countryCode}
                          onValueChange={(country) => {
                            updateFormData("country", country.name);
                            updateFormData("countryCode", country.isoCode);
                            updateFormData("state", "");
                            updateFormData("stateCode", "");
                          }}
                        />
                      </div>

                      {statesForCountry.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            State/Province
                          </Label>
                          <StateCombobox
                            countryCode={formData.countryCode}
                            value={formData.stateCode}
                            onValueChange={(state) => {
                              updateFormData("state", state.name);
                              updateFormData("stateCode", state.isoCode);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Have you applied to BobaLUG before?</Label>
                    <YesNoToggle
                      value={formData.appliedBefore}
                      onChange={(value) =>
                        updateFormData("appliedBefore", value)
                      }
                    />
                    {formData.appliedBefore && (
                      <div className="mt-4 space-y-2">
                        <Label>How many times?</Label>
                        <NumberButtonGroup
                          options={[1, 2, 3, 4, 5]}
                          value={formData.previousApplications}
                          onChange={(value) =>
                            updateFormData("previousApplications", value)
                          }
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Social Media */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-primary" />
                    Social Media
                  </CardTitle>
                  <CardDescription>
                    Where can we find your LEGO content? (All optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram Username
                    </Label>
                    <div className="flex items-center">
                      <span className="flex h-10 items-center rounded-l-xl border border-r-0 border-input bg-muted px-3 text-muted-foreground">
                        @
                      </span>
                      <Input
                        id="instagram"
                        placeholder="yourusername"
                        value={formData.instagramUsername}
                        onChange={(e) =>
                          updateFormData("instagramUsername", e.target.value)
                        }
                        className="rounded-l-none bg-muted/30"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="flickr">Flickr Username</Label>
                    <Input
                      id="flickr"
                      placeholder="Your Flickr username"
                      value={formData.flickrUsername}
                      onChange={(e) =>
                        updateFormData("flickrUsername", e.target.value)
                      }
                      className="bg-muted/30"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="youtube" className="flex items-center gap-2">
                      <Youtube className="h-4 w-4" />
                      YouTube Channel
                    </Label>
                    <Input
                      id="youtube"
                      placeholder="Channel URL or name"
                      value={formData.youtubeChannel}
                      onChange={(e) =>
                        updateFormData("youtubeChannel", e.target.value)
                      }
                      className="bg-muted/30"
                    />
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="youtubeExp">
                        YouTube Experience (if any)
                      </Label>
                      <Textarea
                        id="youtubeExp"
                        placeholder="Tell us about your YouTube content or experience..."
                        value={formData.youtubeExperience}
                        onChange={(e) =>
                          updateFormData("youtubeExperience", e.target.value)
                        }
                        rows={3}
                        className="resize-none bg-muted/30"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="other">Other Social Media</Label>
                    <Textarea
                      id="other"
                      placeholder="TikTok, Twitter/X, or other platforms..."
                      value={formData.otherSocialMedia}
                      onChange={(e) =>
                        updateFormData("otherSocialMedia", e.target.value)
                      }
                      rows={3}
                      className="resize-none bg-muted/30"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Building Experience */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    Building Experience
                  </CardTitle>
                  <CardDescription>
                    Tell us about your MOC-building journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <Label>How long have you been building MOCs?</Label>
                    <ButtonGroup
                      options={[
                        {
                          value: "1-2",
                          label: "1-2 years",
                          description: "Just getting started",
                        },
                        {
                          value: "2-3",
                          label: "2-3 years",
                          description: "Building experience",
                        },
                        {
                          value: "3-5",
                          label: "3-5 years",
                          description: "Solid experience",
                        },
                        {
                          value: "5+",
                          label: "5+ years",
                          description: "Veteran builder",
                        },
                      ]}
                      value={formData.yearsBuilding}
                      onChange={(value) =>
                        updateFormData("yearsBuilding", value)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>
                      How would you rate your MOCs? (1-10)
                      <span className="ml-2 text-muted-foreground">
                        (Be honest!)
                      </span>
                    </Label>
                    <RatingSlider
                      value={formData.selfRating}
                      onChange={(value) => updateFormData("selfRating", value)}
                      min={1}
                      max={10}
                      labels={{ min: "Learning", max: "Expert" }}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>How many MOCs do you make monthly?</Label>
                    <NumberButtonGroup
                      options={[1, 2, 3, 5]}
                      value={formData.mocsPerMonth}
                      onChange={(value) =>
                        updateFormData("mocsPerMonth", value)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>What size are your MOCs typically?</Label>
                    <ButtonGroup
                      options={[
                        {
                          value: "vignette",
                          label: "Vignettes",
                          description: "Small scenes",
                        },
                        {
                          value: "minimoc",
                          label: "Mini MOCs",
                          description: "Compact builds",
                        },
                        {
                          value: "medium",
                          label: "Medium/Big",
                          description: "1 baseplate",
                        },
                        {
                          value: "large",
                          label: "Large",
                          description: "2+ baseplates",
                        },
                      ]}
                      value={formData.mocSize}
                      onChange={(value) => updateFormData("mocSize", value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Your Work */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Your Work
                  </CardTitle>
                  <CardDescription>
                    Show us your best MOCs and tell us about your activity level
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <Label>Your Best MOCs</Label>
                    <p className="text-sm text-muted-foreground">
                      Upload photos of your 3 best MOCs. Show us what you can build!
                    </p>
                    <ImageUploader
                      images={formData.mocImageIds}
                      onImagesChange={(ids) => updateFormData("mocImageIds", ids)}
                      maxImages={5}
                    />
                    {formData.mocImageIds.length < 1 && (
                      <p className="text-sm text-destructive">
                        Please upload at least 1 image
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Expected Activity Level</Label>
                    <p className="text-sm text-muted-foreground">
                      How active do you plan to be? (Social media, Discord,
                      events, building)
                    </p>
                    <ActivitySelector
                      value={formData.activityLevel}
                      onChange={(value) =>
                        updateFormData("activityLevel", value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Deep Dive */}
            {currentStep === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Deep Dive Questions
                  </CardTitle>
                  <CardDescription>
                    We&apos;d love to learn more about you! Please write 2-3
                    sentences minimum.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="about">
                      Tell us about yourself and how you got into the LEGO hobby
                    </Label>
                    <Textarea
                      id="about"
                      placeholder="Share your LEGO journey..."
                      value={formData.aboutYourself}
                      onChange={(e) =>
                        updateFormData("aboutYourself", e.target.value)
                      }
                      rows={4}
                      className="resize-none bg-muted/30"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="thrive">
                      What makes a LEGO community thrive, and how would you
                      contribute?
                    </Label>
                    <Textarea
                      id="thrive"
                      placeholder="Your thoughts on community building..."
                      value={formData.communityThrive}
                      onChange={(e) =>
                        updateFormData("communityThrive", e.target.value)
                      }
                      rows={4}
                      className="resize-none bg-muted/30"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="collab">
                      How do you approach collaboration? Share an example of a
                      team project.
                    </Label>
                    <Textarea
                      id="collab"
                      placeholder="Describe your collaborative experience..."
                      value={formData.collaborationExample}
                      onChange={(e) =>
                        updateFormData("collaborationExample", e.target.value)
                      }
                      rows={4}
                      className="resize-none bg-muted/30"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="disagree">
                      How do you handle disagreements with others?
                    </Label>
                    <Textarea
                      id="disagree"
                      placeholder="Your approach to conflict resolution..."
                      value={formData.handleDisagreements}
                      onChange={(e) =>
                        updateFormData("handleDisagreements", e.target.value)
                      }
                      rows={4}
                      className="resize-none bg-muted/30"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="strengths">
                      What do you think you build better than others in your
                      MOCs?
                    </Label>
                    <Textarea
                      id="strengths"
                      placeholder="Your building strengths..."
                      value={formData.buildStrengths}
                      onChange={(e) =>
                        updateFormData("buildStrengths", e.target.value)
                      }
                      rows={3}
                      className="resize-none bg-muted/30"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="challenge">
                      Describe a challenge you faced while building and how you
                      overcame it.
                    </Label>
                    <Textarea
                      id="challenge"
                      placeholder="A building challenge and what you learned..."
                      value={formData.challengeOvercome}
                      onChange={(e) =>
                        updateFormData("challengeOvercome", e.target.value)
                      }
                      rows={4}
                      className="resize-none bg-muted/30"
                    />
                  </div>

                  <Separator />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label htmlFor="theme">Favorite theme to build?</Label>
                      <ThemeCombobox
                        value={formData.favoriteTheme}
                        onValueChange={(value) =>
                          updateFormData("favoriteTheme", value)
                        }
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="conventions">
                        LEGO conventions? (Optional)
                      </Label>
                      <Input
                        id="conventions"
                        placeholder="BrickCon, Brickworld..."
                        value={formData.conventions}
                        onChange={(e) =>
                          updateFormData("conventions", e.target.value)
                        }
                        className="bg-muted/30"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 6: Goals */}
            {currentStep === 6 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Motivation & Goals
                  </CardTitle>
                  <CardDescription>
                    Tell us about your aspirations in the LEGO community
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="motivation">
                      What motivates you to be involved in a community? How do
                      you stay engaged?
                    </Label>
                    <Textarea
                      id="motivation"
                      placeholder="What drives your community participation..."
                      value={formData.communityMotivation}
                      onChange={(e) =>
                        updateFormData("communityMotivation", e.target.value)
                      }
                      rows={4}
                      className="resize-none bg-muted/30"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="ambitions">
                      What are your ambitions within the LEGO community?
                    </Label>
                    <Textarea
                      id="ambitions"
                      placeholder="Your goals and aspirations..."
                      value={formData.legoAmbitions}
                      onChange={(e) =>
                        updateFormData("legoAmbitions", e.target.value)
                      }
                      rows={4}
                      className="resize-none bg-muted/30"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="improve">
                      What&apos;s one thing you could improve on in MOC
                      building?
                    </Label>
                    <Textarea
                      id="improve"
                      placeholder="An area you'd like to develop..."
                      value={formData.improvementArea}
                      onChange={(e) =>
                        updateFormData("improvementArea", e.target.value)
                      }
                      rows={3}
                      className="resize-none bg-muted/30"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="whyJoin">
                      Why do you want to join BobaLUG?
                    </Label>
                    <Textarea
                      id="whyJoin"
                      placeholder="Tell us what draws you to our community..."
                      value={formData.whyJoin}
                      onChange={(e) =>
                        updateFormData("whyJoin", e.target.value)
                      }
                      rows={4}
                      className="resize-none bg-muted/30"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="questions">
                      Any questions for us? (Optional)
                    </Label>
                    <Textarea
                      id="questions"
                      placeholder="Anything you'd like to ask..."
                      value={formData.questionsForUs}
                      onChange={(e) =>
                        updateFormData("questionsForUs", e.target.value)
                      }
                      rows={3}
                      className="resize-none bg-muted/30"
                    />
                  </div>

                  {/* Review Notice */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                    <h4 className="font-medium">Before You Submit</h4>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        We review applications every 2 weeks
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        You&apos;ll receive a decision via Discord
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        A copy of your responses will be emailed to you
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {/* Save indicator - subtle, in the middle */}
              <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : isDirty ? (
                  <span className="opacity-60">Unsaved changes</span>
                ) : lastSaved ? (
                  <>
                    <Check className="h-3 w-3 text-primary" />
                    <span>Saved</span>
                  </>
                ) : null}
              </div>

              {currentStep < 6 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed()}
                  className="gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <Check className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </section>
            </>
          )}
        </Authenticated>
      </main>

      <Footer />
    </div>
  );
}
