/**
 * INCIDENT_PLAYBOOKS — Dynamic actions per incident type
 * Each type has unique P1/P2/P3 steps reflecting real mining protocols.
 */

import {
  Users, Radio, Wind, DoorOpen, Zap, PhoneCall, Flame,
  ShieldAlert, Droplets, Thermometer, BatteryWarning,
  FlameKindling, Waves, HeartPulse, WrenchIcon, TriangleAlert
} from 'lucide-react';

export const INCIDENT_PLAYBOOKS = {

  CO_LEAK: {
    description: 'Carbon Monoxide Leak — toxic gas accumulation',
    P1: {
      label: 'Immediate', description: 'Toxic CO — evacuate NOW within 60s',
      items: [
        { id:'evacuate', icon:Users, isButton:true, label:'Initiate Zone Evacuation',
          detail:'Sound alarm + broadcast on channel 7. Personnel exit via Route A immediately.' ,
          actionLabel:'Activate Alarm', actionDoneLabel:'Activating…' },
        { id:'comms', icon:Radio, isButton:true, label:'Ping Underground Comms',
          detail:'Verify headcount via emergency radio. Confirm all workers evacuating.',
          actionLabel:'Send Ping', actionDoneLabel:'Sending…' },
      ],
    },
    P2: {
      label: 'Urgent', description: 'Containment — restore airflow within 3 min',
      items: [
        { id:'fan_restart', icon:Wind, isButton:true, isFanOverride:true,
          label:'Force Restart Extraction Fan',
          detail:'Override soft-stop and force-restart primary extraction fan. Restores 65% airflow.',
          actionLabel:'Force Restart', actionDoneLabel:'Restarting…' },
        { id:'boosters', icon:Zap, isCheckbox:true, label:'Activate Booster Fans (Adjacent Levels)',
          detail:'Increase fresh air intake to dilute CO concentration.' },
        { id:'vent', icon:DoorOpen, isCheckbox:true, label:'Open Emergency Vent Shaft V-09',
          detail:'Route exhaust through secondary ventilation system.' },
      ],
    },
    P3: {
      label: 'Follow-up', description: 'Post-containment — within 15 min',
      items: [
        { id:'surface', icon:PhoneCall, isCheckbox:true, label:'Notify Surface Control Room',
          detail:'Report incident to surface management and emergency services standby.' },
        { id:'log', icon:Flame, isCheckbox:true, label:'Log CO Incident in Safety System',
          detail:'Document timestamp, affected zones, CO peak readings.' },
      ],
    },
  },

  O2_DEPLETION: {
    description: 'Oxygen Depletion — asphyxiation risk',
    P1: {
      label: 'Immediate', description: 'O₂ critically low — personnel at asphyxiation risk',
      items: [
        { id:'o2_packs', icon:HeartPulse, isButton:true,
          label:'Deploy Emergency O₂ Breathing Packs',
          detail:'Dispatch O₂ packs to ALL personnel in zone. Do NOT wait — unconsciousness can occur below 16%.',
          actionLabel:'Deploy O₂ Packs', actionDoneLabel:'Deploying…' },
        { id:'evacuate_b', icon:Users, isButton:true,
          label:'Priority Evacuation via Route B (Downwind)',
          detail:'Exit downwind of inert gas source. Oxygen masks required for re-entry.',
          actionLabel:'Sound Evacuation', actionDoneLabel:'Sounding…' },
      ],
    },
    P2: {
      label: 'Urgent', description: 'Restore breathable air supply',
      items: [
        { id:'intakes', icon:Wind, isCheckbox:true, label:'Open All Fresh Air Intake Valves (IAV-1 to IAV-4)',
          detail:'Maximize fresh air volume to flush inert gas buildup.' },
        { id:'purge', icon:Droplets, isButton:true, label:'Activate Zone Air Purge Cycle',
          detail:'Run emergency purge — 100% fresh air exchange over 5 minutes.',
          actionLabel:'Start Purge', actionDoneLabel:'Purging…' },
        { id:'inert_source', icon:ShieldAlert, isCheckbox:true, label:'Locate & Isolate Inert Gas Source (N₂/CO₂)',
          detail:'Check nitrogen lines, CO₂ fire suppression discharge, natural seam venting.' },
      ],
    },
    P3: {
      label: 'Follow-up', description: 'Safe re-entry protocol',
      items: [
        { id:'medical', icon:HeartPulse, isCheckbox:true, label:'Medical Team on Standby at Level Entry',
          detail:'Paramedic and oxygen resuscitation kit required at entry point.' },
        { id:'verify_o2', icon:ShieldAlert, isCheckbox:true, label:'Verify O₂ > 19.5% Before Any Re-entry',
          detail:'Continuous monitoring required. Do NOT re-enter below 19.5%.' },
        { id:'log', icon:Flame, isCheckbox:true, label:'Log O₂ Depletion Incident',
          detail:'Document O₂ low point, inert gas source, recovery timeline.' },
      ],
    },
  },

  FAN_FAILURE: {
    description: 'Primary Fan Failure — ventilation compromised',
    P1: {
      label: 'Immediate', description: 'Fan offline — CO will build. Alert all personnel NOW',
      items: [
        { id:'alert_reduced', icon:TriangleAlert, isButton:true,
          label:'Broadcast Reduced Ventilation Alert',
          detail:'Warn all personnel: primary fan offline, minimize physical exertion, standby for evacuation.',
          actionLabel:'Broadcast Alert', actionDoneLabel:'Broadcasting…' },
        { id:'backup_circuit', icon:BatteryWarning, isButton:true,
          label:'Switch to Backup Air Supply Circuit',
          detail:'Activate redundant air blower circuit BLW-02 via control panel.',
          actionLabel:'Activate Backup', actionDoneLabel:'Activating…' },
      ],
    },
    P2: {
      label: 'Urgent', description: 'Restore primary ventilation',
      items: [
        { id:'power_check', icon:Zap, isCheckbox:true, label:'Check Fan Power Supply & Breaker (CB-F02)',
          detail:'Inspect main breaker and power feed. Common cause: thermal overload trip.' },
        { id:'fan_restart', icon:Wind, isButton:true, isFanOverride:true,
          label:'Attempt Primary Fan Restart (FAN-0X)',
          detail:'Clear thermal fault and force-restart. Monitor current draw for second trip.',
          actionLabel:'Restart Fan', actionDoneLabel:'Restarting…' },
        { id:'adj_fans', icon:WrenchIcon, isCheckbox:true, label:'Maximize Adjacent Level Fan Speeds',
          detail:'Compensate airflow shortfall by boosting fans on adjacent levels.' },
      ],
    },
    P3: {
      label: 'Follow-up', description: 'Root cause and maintenance',
      items: [
        { id:'maint', icon:WrenchIcon, isCheckbox:true, label:'Dispatch Mechanical Maintenance Crew',
          detail:'Bearing inspection, motor winding check, impeller damage assessment.' },
        { id:'rca', icon:ShieldAlert, isCheckbox:true, label:'Complete Root Cause Analysis Form',
          detail:'Document failure mode, downtime, and corrective actions.' },
        { id:'log', icon:Flame, isCheckbox:true, label:'Log Fan Failure Event',
          detail:'Record fan ID, failure time, restart attempts, resolution.' },
      ],
    },
  },

  METHANE_GAS: {
    description: 'Methane Gas (CH₄) — explosion risk EXTREME',
    P1: {
      label: 'CRITICAL — EXPLOSION RISK', description: 'Eliminate ALL ignition sources immediately',
      items: [
        { id:'ignition_off', icon:FlameKindling, isButton:true,
          label:'⚡ ELIMINATE ALL IGNITION SOURCES NOW',
          detail:'Cut all electrical equipment, stop diesel engines, ban open flames. Any spark = explosion.',
          actionLabel:'Cut Power to Zone', actionDoneLabel:'Cutting Power…' },
        { id:'evacuate_blast', icon:Users, isButton:true,
          label:'Emergency Evacuation — Blast Protocol',
          detail:'All personnel exit immediately via Route C (upwind). Safety zone is 500m from level entry.',
          actionLabel:'Blast Evacuation', actionDoneLabel:'Evacuating…' },
      ],
    },
    P2: {
      label: 'Urgent', description: '⚠️ SPECIAL: DO NOT restart fans — spark risk',
      items: [
        { id:'no_fan', icon:TriangleAlert, isButton:true, isManualFanOff:true,
          label:'⛔ Confirm & Execute Fan Shutdown',
          detail:'AUTO-SHUTOFF activated on CH₄ detection. Formally confirm: FAN is OFF. Passive vents are sole ventilation until gas clears.',
          actionLabel:'Confirm Fan OFF', actionDoneLabel:'Confirming…' },
        { id:'blast_vents', icon:DoorOpen, isCheckbox:true,
          label:'Open Blast-Proof Passive Vents Only (BPV-01/02)',
          detail:'Open passive vents that use no electrical components. Natural draft only.' },
        { id:'elec_isolate', icon:BatteryWarning, isButton:true,
          label:'Isolate All Electrical Circuits in Zone',
          detail:'Lock-out tag-out (LOTO) procedure on zone distribution board.',
          actionLabel:'Isolate Circuits', actionDoneLabel:'Isolating…' },
      ],
    },
    P3: {
      label: 'Follow-up', description: 'Clearance before any re-entry',
      items: [
        { id:'gas_team', icon:ShieldAlert, isCheckbox:true, label:'Gas Detection Team Entry (Intrinsically Safe Equipment Only)',
          detail:'Certified gas technicians with ATEX-rated instruments only.' },
        { id:'ch4_clear', icon:Wind, isCheckbox:true, label:'Confirm CH₄ < 1% LEL Before Re-entry',
          detail:'Lower Explosive Limit for methane is 5%. No re-entry above 1% as safety margin.' },
        { id:'log', icon:Flame, isCheckbox:true, label:'Log Methane Incident — Regulatory Report',
          detail:'Methane events require mandatory regulatory notification within 2 hours.' },
      ],
    },
  },

  HEAT_EMERGENCY: {
    description: 'High Temperature Alert — heat stroke risk',
    P1: {
      label: 'Immediate', description: 'Personnel at heat stroke risk — act in 60s',
      items: [
        { id:'cooling', icon:Thermometer, isButton:true,
          label:'Issue Cooling Packs to All Zone Personnel',
          detail:'Deploy ice vests, cold water and electrolytes to all workers in zone immediately.',
          actionLabel:'Deploy Cooling', actionDoneLabel:'Deploying…' },
        { id:'reduce_work', icon:HeartPulse, isButton:true,
          label:'Cease Heavy Physical Work — Heat Stroke Risk',
          detail:'All personnel stop physical activity. Move to shaded/cooled rest area. Monitor for symptoms.',
          actionLabel:'Broadcast Stop-Work', actionDoneLabel:'Broadcasting…' },
      ],
    },
    P2: {
      label: 'Urgent', description: 'Reduce zone temperature',
      items: [
        { id:'max_vent', icon:Wind, isCheckbox:true, label:'Maximize Ventilation Speed — All Zone Fans to 100%',
          detail:'Increase airflow velocity to maximum rated RPM for all fans in zone.' },
        { id:'cooling_water', icon:Waves, isCheckbox:true, label:'Check Cooling Water Lines (CWL-3 & CWL-4)',
          detail:'Verify chilled water supply pressure and flow rate to zone heat exchangers.' },
        { id:'portable_ac', icon:Thermometer, isButton:true,
          label:'Deploy Portable Spot-Cooling Units',
          detail:'Transport portable AC units from Surface Store 2B to active work areas.',
          actionLabel:'Deploy AC Units', actionDoneLabel:'Deploying…' },
      ],
    },
    P3: {
      label: 'Follow-up', description: 'Medical monitoring and review',
      items: [
        { id:'medical_monitor', icon:HeartPulse, isCheckbox:true,
          label:'Medical Monitoring for Heat-Related Illness',
          detail:'Check all personnel for dizziness, nausea, confusion. Refer for treatment immediately.' },
        { id:'env_log', icon:Flame, isCheckbox:true,
          label:'Log Environmental Conditions (Temp, Humidity, Wet-Bulb)',
          detail:'Wet-bulb globe temperature (WBGT) must be recorded for incident report.' },
        { id:'inspection', icon:WrenchIcon, isCheckbox:true,
          label:'Schedule Cooling System Inspection',
          detail:'Identify root cause of thermal anomaly: geothermal increase, HVAC failure, hot-work proximity.' },
      ],
    },
  },
};

export const INCIDENT_COLORS = {
  CO_LEAK:       { badge: 'bg-red-600 text-white',    border: 'border-red-600/60',  bg: 'bg-red-950/30',  text: 'text-red-300',   dot: 'bg-red-500' },
  O2_DEPLETION:  { badge: 'bg-purple-600 text-white', border: 'border-purple-600/50', bg: 'bg-purple-950/20', text: 'text-purple-300', dot: 'bg-purple-500' },
  FAN_FAILURE:   { badge: 'bg-amber-500 text-black',  border: 'border-amber-500/50', bg: 'bg-amber-950/20', text: 'text-amber-300',  dot: 'bg-amber-500' },
  METHANE_GAS:   { badge: 'bg-orange-600 text-white', border: 'border-orange-500/60', bg: 'bg-orange-950/20', text: 'text-orange-300', dot: 'bg-orange-500' },
  HEAT_EMERGENCY:{ badge: 'bg-rose-600 text-white',   border: 'border-rose-600/50',  bg: 'bg-rose-950/20',  text: 'text-rose-300',  dot: 'bg-rose-500' },
};
