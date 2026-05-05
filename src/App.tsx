import { useState, useEffect, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  History as HistoryIcon, 
  LayoutDashboard, 
  Dumbbell, 
  ChevronRight, 
  Trash2, 
  Check, 
  PlusCircle, 
  Calendar,
  X
} from 'lucide-react';
import { Workout, Exercise, Set, View } from './types';
import { COMMON_EXERCISES, PRESET_WORKOUTS } from './constants';

const STORAGE_KEY = 'pulse_performance_workouts';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  // Load workouts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setWorkouts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse workouts", e);
      }
    }
  }, []);

  // Save workouts to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  }, [workouts]);

  const addWorkout = (workout: Workout) => {
    setWorkouts([workout, ...workouts]);
  };

  const deleteWorkout = (id: string) => {
    setWorkouts(workouts.filter(w => w.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative overflow-hidden bg-black selection:bg-brand-accent/30 font-sans">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-brand-secondary text-[10px] font-mono uppercase tracking-[0.2em]">
            Pulse / Performance
          </h2>
          <motion.h1 
            key={view}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold tracking-tight mt-1 text-white"
          >
            {view === 'dashboard' ? 'Главная' : 
             view === 'history' ? 'Архив' : 
             view === 'details' ? 'Детали' : 'Тренировка'}
          </motion.h1>
        </div>
        {view !== 'log' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setView('log')}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg shadow-white/10"
            id="add-workout-btn"
          >
            <Plus size={24} />
          </motion.button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-32">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <Dashboard 
              workouts={workouts} 
              onStart={() => setView('log')}
              key="dashboard" 
            />
          )}
          {view === 'history' && (
            <History 
              workouts={workouts} 
              onDelete={deleteWorkout} 
              onSelect={(w) => {
                setSelectedWorkout(w);
                setView('details');
              }}
              key="history" 
            />
          )}
          {view === 'details' && selectedWorkout && (
            <WorkoutDetails 
              workout={selectedWorkout} 
              onBack={() => {
                setSelectedWorkout(null);
                setView('history');
              }}
              key="details"
            />
          )}
          {view === 'log' && (
            <LogWorkout 
              workouts={workouts}
              onSave={(w) => {
                addWorkout(w);
                setShowSuccess(true);
                setView('history');
              }} 
              onCancel={() => setView('dashboard')}
              key="log" 
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.5, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                className="glass p-8 rounded-[40px] text-center space-y-6 max-w-sm"
              >
                <div className="w-20 h-20 bg-brand-accent rounded-full mx-auto flex items-center justify-center text-white shadow-2xl shadow-brand-accent/40">
                  <Check size={40} />
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">МОЛОДЕЦ, СОСИ ЯЙЦА</h2>
                <button 
                  onClick={() => setShowSuccess(false)}
                  className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-neutral-200 transition-colors"
                >
                  ЕСТЬ, СЭР!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t border-white/5 px-6 pt-4 safe-area-bottom z-50 rounded-t-[32px]">
        <div className="flex justify-around items-center">
          <NavButton 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label="Главная"
          />
          <NavButton 
            active={view === 'history'} 
            onClick={() => setView('history')} 
            icon={<HistoryIcon size={20} />} 
            label="Архив"
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center py-2 transition-all duration-300 ${active ? 'text-white' : 'text-brand-secondary'}`}
    >
      <div className={`p-2 rounded-xl ${active ? 'bg-white/10' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] uppercase tracking-widest mt-1 font-medium">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-1"
        />
      )}
    </button>
  );
}

function Dashboard({ workouts, onStart }: { workouts: Workout[], onStart: () => void, key?: string }) {
  const stats = useMemo(() => {
    const totalWorkouts = workouts.length;
    const totalSets = workouts.reduce((acc, w) => acc + w.exercises.reduce((eAcc, e) => eAcc + e.sets.length, 0), 0);
    const totalVolume = workouts.reduce((acc, w) => 
      acc + w.exercises.reduce((eAcc, e) => 
        eAcc + e.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0), 0);
    const lastSession = workouts[0]?.date || 'None';
    
    // Calculate records
    const records: Record<string, number> = {};
    workouts.forEach(w => {
      w.exercises.forEach(e => {
        const componentMax = e.sets.reduce((max, s) => Math.max(max, s.weight), 0);
        if (!records[e.name] || componentMax > records[e.name]) {
          records[e.name] = componentMax;
        }
      });
    });
    const topRecords = Object.entries(records)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return { totalWorkouts, totalSets, totalVolume, lastSession, topRecords };
  }, [workouts]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 mt-4"
    >
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onStart}
        className="w-full py-6 rounded-[32px] bg-brand-accent text-white font-black uppercase italic tracking-tighter text-2xl shadow-2xl shadow-brand-accent/40 flex items-center justify-center gap-3 border border-white/20"
      >
        <Dumbbell size={28} />
        НАЧАТЬ ТРЕНИРОВКУ
      </motion.button>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-5 rounded-3xl space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-brand-secondary font-mono">Тренировки</p>
          <p className="text-3xl font-bold">{stats.totalWorkouts}</p>
        </div>
        <div className="glass p-5 rounded-3xl space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-brand-secondary font-mono">Тоннаж (т)</p>
          <p className="text-3xl font-bold">{Math.floor(stats.totalVolume / 1000)}<span className="text-sm font-normal text-brand-secondary ml-1">.{Math.floor((stats.totalVolume % 1000) / 100)}</span></p>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl shadow-2xl shadow-brand-accent/5">
        <h3 className="text-xs font-semibold mb-3 flex items-center gap-2 text-brand-secondary uppercase tracking-widest">
          <Calendar size={14} className="text-brand-accent" />
          Последняя сессия
        </h3>
        <p className="text-xl font-medium text-white/90">
          {stats.lastSession !== 'None' 
            ? new Date(stats.lastSession).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
            : 'ПОРА СОСАТЬ ПАПЕ ЯЙЦА'}
        </p>
      </div>

      {stats.topRecords.length > 0 && (
        <div className="glass p-6 rounded-3xl">
          <h3 className="text-xs font-semibold mb-4 flex items-center gap-2 text-brand-secondary uppercase tracking-widest">
            <Dumbbell size={14} className="text-brand-accent" />
            Личные Рекорды
          </h3>
          <div className="space-y-3">
            {stats.topRecords.map(([name, weight]) => (
              <div key={name} className="flex justify-between items-center text-sm">
                <span className="text-white/60">{name}</span>
                <span className="font-mono font-bold text-brand-accent">{weight} кг</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-brand-secondary font-mono">Карта интенсивности</h3>
        </div>
        <div className="flex gap-1.5 h-10">
          {Array.from({ length: 7 }).map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 rounded-md transition-colors duration-500 ${i < stats.totalWorkouts ? 'bg-brand-accent' : 'bg-white/5'}`}
            />
          ))}
        </div>
        <p className="text-[10px] text-brand-secondary italic">Еженедельный трекер жеребца.</p>
      </div>
    </motion.div>
  );
}

function WorkoutDetails({ workout, onBack }: { workout: Workout, onBack: () => void, key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 pt-4"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-brand-secondary">
          <X size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight text-white italic uppercase">{workout.name}</h1>
          <p className="text-[10px] font-mono text-brand-secondary uppercase tracking-widest leading-none mt-1">
            {new Date(workout.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {workout.exercises.map((ex) => (
          <div key={ex.id} className="glass rounded-[32px] p-6 space-y-4">
            <h4 className="font-bold text-lg flex items-center gap-2">
              <Dumbbell size={18} className="text-brand-accent" />
              {ex.name}
            </h4>
            <div className="space-y-2">
              <div className="grid grid-cols-3 text-[10px] uppercase font-mono tracking-widest text-brand-secondary px-2">
                <span>Подход</span>
                <span>Вес (кг)</span>
                <span className="text-center">Повторы</span>
              </div>
              {ex.sets.map((s, i) => (
                <div key={s.id} className="grid grid-cols-3 items-center px-2 py-3 border-b border-white/5 last:border-0">
                  <span className="font-mono text-xs opacity-50 px-2">{i + 1}</span>
                  <span className="font-bold text-sm tracking-tight">{s.weight} кг</span>
                  <span className="text-center font-bold text-sm tracking-tight">{s.reps}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="h-24" />
    </motion.div>
  );
}

function LogWorkout({ workouts, onSave, onCancel }: { workouts: Workout[], onSave: (w: Workout) => void, onCancel: () => void, key?: string }) {
  const [name, setName] = useState('Новая тренировка');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');

  const getWorkingWeight = (exName: string) => {
    let max = 0;
    workouts.forEach(w => {
      w.exercises.forEach(e => {
        if (e.name === exName || exName.includes(e.name) || e.name.includes(exName)) {
          e.sets.forEach(s => {
            if (s.weight > max) max = s.weight;
          });
        }
      });
    });
    return max;
  };

  const loadPreset = (preset: typeof PRESET_WORKOUTS[0]) => {
    setName(preset.name);
    const newExercises: Exercise[] = preset.exercises.map(pEx => ({
      id: Math.random().toString(36).substr(2, 9),
      name: pEx.name,
      sets: Array.from({ length: pEx.setsCount }).map(() => ({
        id: Math.random().toString(36).substr(2, 9),
        weight: getWorkingWeight(pEx.name),
        reps: 0
      }))
    }));
    setExercises(newExercises);
  };

  const addNewExercise = (exName: string) => {
    const workingWeight = getWorkingWeight(exName);
    const newEx: Exercise = {
      id: Math.random().toString(36).substr(2, 9),
      name: exName,
      sets: [{ id: Math.random().toString(36).substr(2, 9), weight: workingWeight, reps: 0 }]
    };
    setExercises([...exercises, newEx]);
    setSearch('');
  };

  const updateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      }
      return ex;
    }));
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, { 
            id: Math.random().toString(36).substr(2, 9), 
            weight: lastSet?.weight || 0, 
            reps: lastSet?.reps || 0 
          }]
        };
      }
      return ex;
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        if (ex.sets.length <= 1) return ex;
        return {
          ...ex,
          sets: ex.sets.filter(s => s.id !== setId)
        };
      }
      return ex;
    }));
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleSave = () => {
    if (exercises.length === 0) return;
    onSave({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      name,
      exercises
    });
  };

  const filteredExercises = COMMON_EXERCISES.filter(ex => 
    ex.toLowerCase().includes(search.toLowerCase()) && 
    !exercises.find(e => e.name === ex)
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="space-y-6 pt-4"
    >
      {exercises.length === 0 && (
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-brand-secondary font-mono px-1">Выберите программу</p>
          <div className="grid grid-cols-1 gap-3">
            {PRESET_WORKOUTS.map((preset) => (
              <button 
                key={preset.name}
                onClick={() => loadPreset(preset)}
                className="glass p-6 rounded-3xl text-left hover:bg-white/5 transition-all group"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg italic tracking-tighter">{preset.name}</span>
                  <ChevronRight size={18} className="text-brand-accent group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[10px] text-brand-secondary uppercase mt-1 tracking-widest">
                  {preset.exercises.length} упражнений
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-bold focus:outline-none focus:border-brand-accent/50 transition-colors"
          placeholder="Название"
        />
        <button onClick={onCancel} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-brand-secondary">
          <X size={20} />
        </button>
      </div>

      {exercises.map((ex) => {
        const bestWeight = getWorkingWeight(ex.name);
        return (
          <motion.div 
            layout
            key={ex.id} 
            className="glass rounded-[32px] p-6 space-y-4 relative overflow-hidden"
          >
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  <Dumbbell size={18} className="text-brand-accent" />
                  {ex.name}
                </h4>
                {bestWeight > 0 && (
                  <p className="text-[10px] text-brand-secondary font-mono">РАБОЧИЙ ВЕС: {bestWeight} кг</p>
                )}
              </div>
              <button 
                onClick={() => removeExercise(ex.id)}
                className="text-brand-secondary hover:text-red-500 transition-colors p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-4 text-[10px] uppercase font-mono tracking-[0.15em] text-brand-secondary px-2">
                <span>Сет</span>
                <span>Вес (кг)</span>
                <span className="text-center">Повт.</span>
                <span className="text-right">Уд.</span>
              </div>
              {ex.sets.map((s, i) => (
                <div key={s.id} className="grid grid-cols-4 items-center gap-2">
                  <span className="font-mono text-xs opacity-50 px-2">{i + 1}</span>
                  <input 
                    type="number"
                    value={s.weight || ''}
                    onChange={(e) => updateSet(ex.id, s.id, 'weight', Number(e.target.value))}
                    className="bg-white/5 rounded-xl py-3 px-3 text-sm focus:outline-none focus:bg-white/10 border border-transparent focus:border-white/10"
                    placeholder="кг"
                  />
                  <input 
                    type="number"
                    value={s.reps || ''}
                    onChange={(e) => updateSet(ex.id, s.id, 'reps', Number(e.target.value))}
                    className="bg-white/5 rounded-xl py-3 px-3 text-sm focus:outline-none text-center focus:bg-white/10 border border-transparent focus:border-white/10"
                    placeholder="0"
                  />
                  <div className="flex justify-end pr-1">
                    <button 
                      onClick={() => removeSet(ex.id, s.id)}
                      className="w-5 h-5 rounded-full flex items-center justify-center bg-white/10 text-white/30 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => addSet(ex.id)}
              className="w-full py-4 rounded-2xl border border-dashed border-white/10 text-[10px] font-mono uppercase tracking-[0.2em] text-brand-secondary hover:bg-white/5 transition-colors"
            >
              + Добавить подход
            </button>
          </motion.div>
        );
      })}

      <div className="relative">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-secondary">
          <PlusCircle size={18} />
        </div>
        <input 
          id="exercise-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-3xl pl-14 pr-6 py-5 text-sm focus:outline-none focus:border-brand-accent/50 transition-colors shadow-inner shadow-black/50"
          placeholder="Найти упражнение..."
        />
        {search && (
          <div className="absolute top-full left-0 right-0 mt-3 glass rounded-3xl max-h-64 overflow-y-auto z-50 shadow-2xl overflow-hidden">
            {filteredExercises.length > 0 ? filteredExercises.map((exName) => (
              <button 
                key={exName}
                onClick={() => addNewExercise(exName)}
                className="w-full text-left px-8 py-4 hover:bg-brand-accent hover:text-white transition-colors border-b border-white/5 last:border-0"
              >
                {exName}
              </button>
            )) : (
              <button 
                onClick={() => addNewExercise(search)}
                className="w-full text-left px-8 py-4 hover:bg-brand-accent hover:text-white transition-colors"
              >
                Добавить "{search}"...
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-1">
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={exercises.length === 0}
          className={`w-full py-5 rounded-[32px] font-bold flex items-center justify-center gap-3 transition-all ${
            exercises.length > 0 ? 'bg-white text-black shadow-2xl shadow-white/10' : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          <PlusCircle size={20} />
          Завершить сессию
        </motion.button>
      </div>

      <div className="h-24" />
    </motion.div>
  );
}

function History({ workouts, onDelete, onSelect }: { workouts: Workout[], onDelete: (id: string) => void, onSelect: (w: Workout) => void, key?: string }) {
  if (workouts.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center pt-24 text-center space-y-6"
      >
        <div className="w-20 h-20 rounded-[40px] glass flex items-center justify-center text-brand-secondary/30">
          <HistoryIcon size={40} />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-white/60">Архив пуст</h3>
          <p className="text-xs text-brand-secondary">Здесь будут твои подвиги.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-4 mt-4"
    >
      {workouts.map((workout) => (
        <div key={workout.id} className="glass rounded-[32px] p-6 space-y-4 group relative overflow-hidden transition-all hover:bg-white/[0.03]">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-lg text-white/90 italic tracking-tighter uppercase">{workout.name}</h4>
              <p className="text-[10px] font-mono text-brand-secondary uppercase tracking-widest mt-1">
                {new Date(workout.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })} • {workout.exercises.length} упражнений
              </p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(workout.id);
              }}
              className="text-white/10 hover:text-red-500 transition-colors p-2"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="space-y-2.5">
            {workout.exercises.slice(0, 2).map((ex) => (
              <div key={ex.id} className="flex justify-between items-center text-sm">
                <span className="text-white/60 font-medium">{ex.name}</span>
                <span className="font-mono text-[9px] text-brand-secondary bg-white/5 px-2 py-0.5 rounded-full">
                  {ex.sets.length} подх.
                </span>
              </div>
            ))}
            {workout.exercises.length > 2 && (
              <p className="text-[10px] text-brand-secondary italic pl-1">+{workout.exercises.length - 2} еще</p>
            )}
          </div>
          
          <button 
            onClick={() => onSelect(workout)}
            className="w-full py-3 rounded-2xl bg-white/5 border border-white/5 flex justify-center items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 hover:border-white/10 transition-all"
          >
            Детали сессии <ChevronRight size={12} className="text-brand-accent" />
          </button>
        </div>
      ))}
    </motion.div>
  );
}

