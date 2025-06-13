
import { create } from 'zustand';
import { Shift, User, Sale } from '../types';

interface ShiftState {
  currentShift: Shift | null;
  shifts: Shift[];
  openShift: (user: User) => void;
  closeShift: () => void;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  currentShift: null,
  shifts: [],
  openShift: (user) => {
    // Garantir que apenas um turno esteja ativo - fechar qualquer turno ativo
    const { shifts } = get();
    const activeShifts = shifts.filter(shift => shift.isActive);
    
    let updatedShifts = shifts;
    
    // Fechar todos os turnos ativos
    activeShifts.forEach(activeShift => {
      const closedShift: Shift = {
        ...activeShift,
        endTime: new Date(),
        isActive: false,
        totalSales: 0,
        totalItems: 0,
        paymentBreakdown: {
          dinheiro: 0,
          debito: 0,
          credito: 0,
          pix: 0,
          cortesia: 0,
        },
      };
      
      updatedShifts = updatedShifts.map(shift => 
        shift.id === activeShift.id ? closedShift : shift
      );
    });
    
    const newShift: Shift = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      startTime: new Date(),
      isActive: true,
      totalSales: 0,
      totalItems: 0,
      paymentBreakdown: {
        dinheiro: 0,
        debito: 0,
        credito: 0,
        pix: 0,
        cortesia: 0,
      },
    };
    
    set({
      currentShift: newShift,
      shifts: [...updatedShifts, newShift],
    });
  },
  closeShift: () => {
    const { currentShift } = get();
    if (!currentShift) return;
    
    const updatedShift: Shift = {
      ...currentShift,
      endTime: new Date(),
      isActive: false,
      totalSales: 0,
      totalItems: 0,
      paymentBreakdown: {
        dinheiro: 0,
        debito: 0,
        credito: 0,
        pix: 0,
        cortesia: 0,
      },
    };
    
    set((state) => ({
      currentShift: null,
      shifts: state.shifts.map(shift => 
        shift.id === currentShift.id ? updatedShift : shift
      ),
    }));
  },
}));
