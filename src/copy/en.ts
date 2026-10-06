export const copy = {
  app: {
    name: 'NoClash',
    tagline: 'Timetable mixer for students',
    footerNote: 'Your picks stay on this device.',
  },

  onboarding: {
    semesterQuestion: 'Which semester are you in?',
    startQuestion: 'How would you like to start?',
    startWithSection: (sectionName: string) => `Start with ${sectionName}`,
    startWithSectionDesc: 'Pre-fills your week with this section. You can swap any class later.',
    startBlank: 'Start with a blank week',
    startBlankDesc: 'Pick each subject component one by one from any section.',
    continue: 'Continue',
  },

  planner: {
    chosenCount: (chosen: number, total: number) => `${chosen} of ${total} chosen`,
    allChosenNoClashes: (total: number) => `All ${total} chosen, no clashes.`,
    clashCount: (count: number) => `${count} ${count === 1 ? 'clash' : 'clashes'}`,
    needsAttention: 'This option changed. Choose again.',
    changeSection: 'Change section',
    clearAll: 'Clear all',
    shareWeek: 'Share week',
    refreshTimetables: 'Refresh timetables',
    usingSavedData: 'Using saved timetables.',
    viewWeave: 'Weave',
    viewList: 'List',
    noPicksYet: 'Choose a component below to begin building your week.',
  },

  options: {
    title: (componentName: string) => `Options for ${componentName}`,
    useThis: 'Use this',
    selected: 'Selected',
    clashWarning: 'Causes a clash with your current picks.',
    noSlotsInSection: 'Not offered in this section.',
  },

  confirm: {
    clearTitle: 'Clear all picks',
    clearMessage: 'This will reset your timetable to a blank week.',
    clearConfirm: 'Clear week',
    cancel: 'Cancel',
    changeSectionTitle: 'Change starting section',
    changeSectionMessage: 'This will replace your current picks with the chosen section.',
    changeSectionConfirm: 'Replace picks',
  },

  sharing: {
    sharedBannerTitle: (semesterLabel: string) => `Viewing a shared schedule for ${semesterLabel}`,
    useThisSchedule: 'Use this schedule',
    keepMySchedule: 'Keep my schedule',
    copyLink: 'Copy share link',
    linkCopied: 'Share link copied to clipboard.',
    copyText: 'Copy text schedule',
    textCopied: 'Schedule text copied to clipboard.',
    saveImage: 'Save timetable image',
    olderDataNotice: 'This schedule was created with older timetable data. Some picks may need updating.',
  },

  errors: {
    genericTitle: 'Something went wrong',
    loadFailed: "That didn't load. Retry",
    retry: 'Retry',
    invalidShare: 'This schedule link could not be decoded.',
    offlineNotice: 'You are currently offline. Using saved data.',
  },
};
