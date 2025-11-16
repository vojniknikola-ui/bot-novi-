import { ApplicationCommandOptionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';

export const commands: RESTPostAPIApplicationCommandsJSONBody[] = [
  {
    name: 'clock-in',
    description: 'Start work session',
    options: [
      {
        name: 'location',
        description: 'office/home/remote',
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: 'Office', value: 'office' },
          { name: 'Home', value: 'home' },
          { name: 'Remote', value: 'remote' }
        ]
      }
    ]
  },
  {
    name: 'clock-out',
    description: 'End work session'
  },
  {
    name: 'pauza-start',
    description: 'Start break'
  },
  {
    name: 'pauza-end',
    description: 'End break'
  },
  {
    name: 'off',
    description: 'Mark yourself as not working'
  },
  {
    name: 'wfh',
    description: 'Clock in for work from home'
  },
  {
    name: 'wfo',
    description: 'Clock in for work from office'
  },
  {
    name: 'time-log',
    description: 'Show recent time entries',
    options: [
      {
        name: 'days',
        description: 'How many days back to show',
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
        max_value: 30
      }
    ]
  },
  {
    name: 'vacation-request',
    description: 'Request vacation',
    options: [
      { name: 'start', description: 'Start date YYYY-MM-DD', type: ApplicationCommandOptionType.String, required: true },
      { name: 'end', description: 'End date YYYY-MM-DD', type: ApplicationCommandOptionType.String, required: true },
      { name: 'working_days', description: 'Number of working days', type: ApplicationCommandOptionType.Integer, required: true },
      { name: 'reason', description: 'Reason for vacation', type: ApplicationCommandOptionType.String, required: false }
    ]
  },
  {
    name: 'sick-leave',
    description: 'Report sick leave',
    options: [
      { name: 'start', description: 'Start date YYYY-MM-DD', type: ApplicationCommandOptionType.String, required: true },
      { name: 'end', description: 'End date YYYY-MM-DD', type: ApplicationCommandOptionType.String, required: true },
      { name: 'working_days', description: 'Number of working days', type: ApplicationCommandOptionType.Integer, required: true },
      { name: 'reason', description: 'Optional note', type: ApplicationCommandOptionType.String, required: false }
    ]
  },
  {
    name: 'vacation-status',
    description: 'View vacation balance'
  },
  {
    name: 'pm-pending',
    description: 'Show pending vacation requests'
  },
  {
    name: 'pm-approve',
    description: 'Approve a vacation request',
    options: [
      { name: 'request_id', description: 'Vacation request ID', type: ApplicationCommandOptionType.String, required: true }
    ]
  },
  {
    name: 'pm-deny',
    description: 'Deny a vacation request',
    options: [
      { name: 'request_id', description: 'Vacation request ID', type: ApplicationCommandOptionType.String, required: true },
      { name: 'reason', description: 'Why it was denied', type: ApplicationCommandOptionType.String, required: true }
    ]
  },
  {
    name: 'admin-approve',
    description: 'Admin approval for vacation',
    options: [
      { name: 'request_id', description: 'Vacation request ID', type: ApplicationCommandOptionType.String, required: true }
    ]
  },
  {
    name: 'admin-set-balance',
    description: 'Set vacation allocation for a user',
    options: [
      { name: 'user', description: 'Target user', type: ApplicationCommandOptionType.User, required: true },
      { name: 'days', description: 'Total vacation days', type: ApplicationCommandOptionType.Integer, required: true, min_value: 1 }
    ]
  },
  {
    name: 'admin-add-days',
    description: 'Add vacation days to a user allocation',
    options: [
      { name: 'user', description: 'Target user', type: ApplicationCommandOptionType.User, required: true },
      { name: 'days', description: 'Days to add', type: ApplicationCommandOptionType.Integer, required: true, min_value: 1 }
    ]
  },
  {
    name: 'admin-remove-days',
    description: 'Remove vacation days from a user allocation',
    options: [
      { name: 'user', description: 'Target user', type: ApplicationCommandOptionType.User, required: true },
      {
        name: 'days',
        description: 'Days to remove',
        type: ApplicationCommandOptionType.Integer,
        required: true,
        min_value: 1
      }
    ]
  },
  {
    name: 'settings',
    description: 'View or update server settings',
    options: [
      { name: 'timezone', description: 'IANA timezone e.g. Europe/Sarajevo', type: ApplicationCommandOptionType.String },
      { name: 'workday_start', description: 'HH:MM start time', type: ApplicationCommandOptionType.String },
      { name: 'workday_end', description: 'HH:MM end time', type: ApplicationCommandOptionType.String },
      { name: 'admin_role', description: 'Role with admin permissions', type: ApplicationCommandOptionType.Role },
      { name: 'pm_role', description: 'Role with PM permissions', type: ApplicationCommandOptionType.Role }
    ]
  },
  {
    name: 'status',
    description: 'Show live team status',
    options: [
      {
        name: 'type',
        description: 'Which status board to show',
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: 'Online', value: 'online' },
          { name: 'On break', value: 'on-break' },
          { name: 'On vacation', value: 'on-vacation' },
          { name: 'Team overview', value: 'team-overview' }
        ]
      }
    ]
  },
  {
    name: 'schedule',
    description: 'Show team schedule snapshots',
    options: [
      {
        name: 'type',
        description: 'Which schedule to show',
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: 'Today', value: 'today' },
          { name: 'Week summary', value: 'week' },
          { name: 'Vacation calendar', value: 'vacation-calendar' }
        ]
      }
    ]
  },
  {
    name: 'report',
    description: 'Run a report',
    options: [
      {
        name: 'type',
        description: 'Which report to run',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: 'time-today', value: 'time-today' },
          { name: 'vacation-pending', value: 'vacation-pending' },
          { name: 'user-activity', value: 'user-activity' },
          { name: 'vacation-usage', value: 'vacation-usage' },
          { name: 'work-hours', value: 'work-hours' }
        ]
      }
    ]
  }
];
