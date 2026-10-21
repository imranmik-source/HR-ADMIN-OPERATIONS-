import React, { useState } from 'react';
import {
  Hotel,
  BedDouble,
  CheckCircle2,
  Calendar,
  UserPlus,
  LogOut,
  BarChart3,
  Grid,
  List,
  AlertCircle,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { DataTable, ColumnDef } from '../common/DataTable.tsx';
import { Modal } from '../common/Modal.tsx';
import { ImportModal } from '../common/ImportModal.tsx';
import {
  GuestHouse,
  Room,
  Allotment,
  UserProfile,
  RoomFacilities,
  RoomType,
  RoomStatus,
  StaffSource,
} from '../../types/index.ts';
import { storage } from '../../services/storage.ts';
import {
  formatDDMMMYYYY,
  calculateRoomStatus,
} from '../../utils/calculations.ts';

interface WorkspaceCProps {
  currentUser: UserProfile;
}

export function WorkspaceC({ currentUser }: WorkspaceCProps) {
  const [activeTab, setActiveTab] = useState<'guesthouses' | 'accommodation'>('accommodation');
  const [accommodationSubView, setAccommodationSubView] = useState<'chart' | 'register' | 'rooms' | 'report'>('chart');

  const [guestHouses, setGuestHouses] = useState<GuestHouse[]>(storage.guestHouses);
  const [rooms, setRooms] = useState<Room[]>(storage.rooms);
  const [allotments, setAllotments] = useState<Allotment[]>(storage.allotments);

  // Guest House Modal
  const [isGHModalOpen, setIsGHModalOpen] = useState(false);
  const [editingGH, setEditingGH] = useState<GuestHouse | null>(null);
  const [ghFormData, setGHFormData] = useState<{
    name: string;
    address: string;
    numberOfRooms: number;
    proposedOccupancy: number;
    hiringDate: string;
    dehiringDate: string;
    status: 'Furnished' | 'Unfurnished';
    facilities: RoomFacilities;
  }>({
    name: '',
    address: '',
    numberOfRooms: 4,
    proposedOccupancy: 8,
    hiringDate: new Date().toISOString().split('T')[0],
    dehiringDate: '',
    status: 'Furnished',
    facilities: {
      singleBed: 4,
      doubleBed: 2,
      bunkBed: 0,
      ceilingFan: 6,
      acSplit: 4,
      acWindow: 0,
      desertCooler: 0,
      mattress: 8,
      sofa3Seater: 1,
      sofa5Seater: 0,
      geyser: 4,
      refrigerator: 1,
      sideTable: 8,
      studyTable: 4,
      studyChair: 4,
      centreTable: 1,
      remarks: '',
    },
  });

  // Allotment Modal
  const [isAllotmentModalOpen, setIsAllotmentModalOpen] = useState(false);
  const [allotmentFormData, setAllotmentFormData] = useState<{
    guestHouseId: string;
    roomId: string;
    bedNo: string;
    staffId: string;
    checkInDate: string;
    expectedCheckOutDate: string;
    remarks: string;
  }>({
    guestHouseId: guestHouses[0]?.id || '',
    roomId: '',
    bedNo: '',
    staffId: '',
    checkInDate: new Date().toISOString().split('T')[0],
    expectedCheckOutDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    remarks: '',
  });
  const [allotmentErrors, setAllotmentErrors] = useState<Record<string, string>>({});

  // Check out confirmation
  const [checkOutTarget, setCheckOutTarget] = useState<Allotment | null>(null);

  // Room Create/Edit modal
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomFormData, setRoomFormData] = useState<{
    guestHouseId: string;
    roomNo: string;
    roomType: RoomType;
  }>({
    guestHouseId: guestHouses[0]?.id || '',
    roomNo: '',
    roomType: 'Double',
  });

  const canEdit = currentUser.role === 'super_admin' || currentUser.role === 'admin_personnel';
  const canDelete = currentUser.role === 'super_admin';

  // Active staff list
  const activeStaffMembers = storage.staff.filter((s) => s.status === 'Active');

  // Currently allotted employee IDs
  const activeAllotmentEmpIds = new Set(
    allotments.filter((a) => a.status === 'Active').map((a) => a.employeeId)
  );

  // Available rooms for selected guest house in Allotment modal
  const availableRoomsForGH = rooms.filter(
    (r) =>
      r.guestHouseId === allotmentFormData.guestHouseId &&
      r.status !== 'Occupied' &&
      r.status !== 'Under Maintenance' &&
      r.beds.some((b) => !b.isOccupied)
  );

  // Available beds for selected room
  const selectedRoom = rooms.find((r) => r.id === allotmentFormData.roomId);
  const availableBeds = selectedRoom?.beds.filter((b) => !b.isOccupied) || [];

  // -------------------------------------------------------------------------
  // ALLOTMENT HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenAllotment = () => {
    const firstGH = guestHouses[0]?.id || '';
    const firstRoom = rooms.find(
      (r) => r.guestHouseId === firstGH && r.beds.some((b) => !b.isOccupied)
    );
    const firstBed = firstRoom?.beds.find((b) => !b.isOccupied)?.bedNo || '';

    setAllotmentFormData({
      guestHouseId: firstGH,
      roomId: firstRoom?.id || '',
      bedNo: firstBed,
      staffId: '',
      checkInDate: new Date().toISOString().split('T')[0],
      expectedCheckOutDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      remarks: '',
    });
    setAllotmentErrors({});
    setIsAllotmentModalOpen(true);
  };

  const handleSaveAllotment = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!allotmentFormData.guestHouseId) errors.guestHouseId = 'Select a guest house';
    if (!allotmentFormData.roomId) errors.roomId = 'Select an available room';
    if (!allotmentFormData.bedNo) errors.bedNo = 'Select an available bed';
    if (!allotmentFormData.staffId) errors.staffId = 'Select an active staff member';
    if (!allotmentFormData.checkInDate) errors.checkInDate = 'Check-in date is required';

    const staffMember = storage.staff.find((s) => s.id === allotmentFormData.staffId);
    if (!staffMember) {
      errors.staffId = 'Invalid staff selection';
    } else {
      // Rule: One employee can hold only ONE active bed across all guest houses
      const alreadyHasBed = allotments.some(
        (a) => a.employeeId === staffMember.employeeId && a.status === 'Active'
      );
      if (alreadyHasBed) {
        errors.staffId = `Employee ${staffMember.name} (${staffMember.employeeId}) already holds an active bed allotment! Check them out first.`;
      }
    }

    // Rule: Room capacity check
    const targetRoom = rooms.find((r) => r.id === allotmentFormData.roomId);
    if (!targetRoom) {
      errors.roomId = 'Room not found';
    } else {
      const occupiedBeds = targetRoom.beds.filter((b) => b.isOccupied).length;
      if (occupiedBeds >= targetRoom.capacity) {
        errors.roomId = `Room capacity full! (Max ${targetRoom.capacity} beds)`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setAllotmentErrors(errors);
      return;
    }

    const gh = guestHouses.find((g) => g.id === allotmentFormData.guestHouseId);
    const newAllotmentId = `alt-${Date.now()}`;

    // 1. Create allotment record
    const newAllotment: Allotment = {
      id: newAllotmentId,
      guestHouseId: allotmentFormData.guestHouseId,
      guestHouseName: gh?.name || 'Guest House',
      roomId: targetRoom!.id,
      roomNo: targetRoom!.roomNo,
      bedNo: allotmentFormData.bedNo,
      employeeId: staffMember!.employeeId,
      employeeName: staffMember!.name,
      allotmentCategory: staffMember!.source, // auto-filled
      checkInDate: allotmentFormData.checkInDate,
      expectedCheckOutDate: allotmentFormData.expectedCheckOutDate,
      status: 'Active',
      remarks: allotmentFormData.remarks.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    // 2. Update room bed status
    const updatedRooms = rooms.map((r) => {
      if (r.id === targetRoom!.id) {
        const nextBeds = r.beds.map((b) =>
          b.bedNo === allotmentFormData.bedNo
            ? { ...b, isOccupied: true, currentAllotmentId: newAllotmentId }
            : b
        );
        return {
          ...r,
          beds: nextBeds,
          status: calculateRoomStatus(nextBeds),
        };
      }
      return r;
    });

    const nextAllotments = [newAllotment, ...allotments];
    setAllotments(nextAllotments);
    setRooms(updatedRooms);
    storage.saveAllotments(nextAllotments);
    storage.saveRooms(updatedRooms);

    storage.logAudit({
      action: 'CHECK_IN',
      workspace: 'Workspace C – Staff Accommodation',
      entityType: 'Allotment',
      entityId: newAllotmentId,
      details: `Checked in ${staffMember!.name} (${staffMember!.source}) to ${gh?.name} Rm ${targetRoom!.roomNo} - ${allotmentFormData.bedNo}`,
    });

    setIsAllotmentModalOpen(false);
  };

  const handleConfirmCheckOut = () => {
    if (!checkOutTarget) return;

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Mark allotment as checked out
    const nextAllotments = allotments.map((a) =>
      a.id === checkOutTarget.id
        ? {
            ...a,
            status: 'Checked Out' as const,
            actualCheckOutDate: todayStr,
          }
        : a
    );

    // 2. Free the bed in the room
    const nextRooms = rooms.map((r) => {
      if (r.id === checkOutTarget.roomId) {
        const nextBeds = r.beds.map((b) =>
          b.bedNo === checkOutTarget.bedNo
            ? { ...b, isOccupied: false, currentAllotmentId: undefined }
            : b
        );
        return {
          ...r,
          beds: nextBeds,
          status: calculateRoomStatus(nextBeds),
        };
      }
      return r;
    });

    setAllotments(nextAllotments);
    setRooms(nextRooms);
    storage.saveAllotments(nextAllotments);
    storage.saveRooms(nextRooms);

    storage.logAudit({
      action: 'CHECK_OUT',
      workspace: 'Workspace C – Staff Accommodation',
      entityType: 'Allotment',
      entityId: checkOutTarget.id,
      details: `Checked out ${checkOutTarget.employeeName} from ${checkOutTarget.guestHouseName} Room ${checkOutTarget.roomNo} - ${checkOutTarget.bedNo}`,
    });

    setCheckOutTarget(null);
  };

  // -------------------------------------------------------------------------
  // GUEST HOUSE HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenAddGH = () => {
    setEditingGH(null);
    setGHFormData({
      name: '',
      address: '',
      numberOfRooms: 4,
      proposedOccupancy: 8,
      hiringDate: new Date().toISOString().split('T')[0],
      dehiringDate: '',
      status: 'Furnished',
      facilities: {
        singleBed: 4,
        doubleBed: 2,
        bunkBed: 0,
        ceilingFan: 6,
        acSplit: 4,
        acWindow: 0,
        desertCooler: 0,
        mattress: 8,
        sofa3Seater: 1,
        sofa5Seater: 0,
        geyser: 4,
        refrigerator: 1,
        sideTable: 8,
        studyTable: 4,
        studyChair: 4,
        centreTable: 1,
        remarks: '',
      },
    });
    setIsGHModalOpen(true);
  };

  const handleOpenEditGH = (gh: GuestHouse) => {
    setEditingGH(gh);
    setGHFormData({
      name: gh.name,
      address: gh.address,
      numberOfRooms: gh.numberOfRooms,
      proposedOccupancy: gh.proposedOccupancy,
      hiringDate: gh.hiringDate,
      dehiringDate: gh.dehiringDate || '',
      status: gh.status,
      facilities: { ...gh.facilities },
    });
    setIsGHModalOpen(true);
  };

  const handleSaveGH = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghFormData.name.trim() || !ghFormData.address.trim()) {
      alert('Please fill in Name and Address.');
      return;
    }

    if (editingGH) {
      const updated = guestHouses.map((g) =>
        g.id === editingGH.id
          ? {
              ...g,
              name: ghFormData.name.trim(),
              address: ghFormData.address.trim(),
              numberOfRooms: Number(ghFormData.numberOfRooms),
              proposedOccupancy: Number(ghFormData.proposedOccupancy),
              hiringDate: ghFormData.hiringDate,
              dehiringDate: ghFormData.dehiringDate.trim() || undefined,
              status: ghFormData.status,
              facilities: ghFormData.facilities,
            }
          : g
      );
      setGuestHouses(updated);
      storage.saveGuestHouses(updated);
      storage.logAudit({
        action: 'UPDATE',
        workspace: 'Workspace C – Staff Accommodation',
        entityType: 'GuestHouse',
        entityId: editingGH.id,
        details: `Updated guest house ${ghFormData.name}`,
      });
    } else {
      const newGHId = `gh-${Date.now()}`;
      const newGH: GuestHouse = {
        id: newGHId,
        name: ghFormData.name.trim(),
        address: ghFormData.address.trim(),
        numberOfRooms: Number(ghFormData.numberOfRooms),
        proposedOccupancy: Number(ghFormData.proposedOccupancy),
        hiringDate: ghFormData.hiringDate,
        dehiringDate: ghFormData.dehiringDate.trim() || undefined,
        status: ghFormData.status,
        facilities: ghFormData.facilities,
        createdAt: new Date().toISOString(),
      };
      const updated = [...guestHouses, newGH];
      setGuestHouses(updated);
      storage.saveGuestHouses(updated);

      // Auto create rooms for this guest house
      const newRooms: Room[] = [];
      for (let i = 1; i <= newGH.numberOfRooms; i++) {
        const capacity = 2;
        const beds = [
          { bedNo: 'Bed 1', isOccupied: false },
          { bedNo: 'Bed 2', isOccupied: false },
        ];
        newRooms.push({
          id: `rm-${newGHId}-${i}`,
          guestHouseId: newGHId,
          guestHouseName: newGH.name,
          roomNo: `Room ${100 + i}`,
          roomType: 'Double',
          capacity,
          beds,
          status: 'Vacant',
        });
      }
      const allUpdatedRooms = [...rooms, ...newRooms];
      setRooms(allUpdatedRooms);
      storage.saveRooms(allUpdatedRooms);

      storage.logAudit({
        action: 'CREATE',
        workspace: 'Workspace C – Staff Accommodation',
        entityType: 'GuestHouse',
        entityId: newGHId,
        details: `Added new guest house ${newGH.name} with ${newGH.numberOfRooms} rooms`,
      });
    }

    setIsGHModalOpen(false);
  };

  // -------------------------------------------------------------------------
  // ROOM ADD HANDLER
  // -------------------------------------------------------------------------
  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const gh = guestHouses.find((g) => g.id === roomFormData.guestHouseId);
    if (!gh || !roomFormData.roomNo.trim()) return;

    const capacity = roomFormData.roomType === 'Single' ? 1 : roomFormData.roomType === 'Double' ? 2 : 4;
    const beds = Array.from({ length: capacity }, (_, i) => ({
      bedNo: `Bed ${i + 1}`,
      isOccupied: false,
    }));

    const newRoom: Room = {
      id: `rm-${Date.now()}`,
      guestHouseId: gh.id,
      guestHouseName: gh.name,
      roomNo: roomFormData.roomNo.trim(),
      roomType: roomFormData.roomType,
      capacity,
      beds,
      status: 'Vacant',
    };

    const updated = [...rooms, newRoom];
    setRooms(updated);
    storage.saveRooms(updated);
    setIsRoomModalOpen(false);
  };

  // Guest Houses Table Columns
  const ghColumns: ColumnDef<GuestHouse>[] = [
    {
      key: 'name',
      header: 'Guest House Name',
      sortable: true,
      sampleTemplateValue: 'Kaveri Residency',
      render: (item) => <span className="font-bold text-slate-900">{item.name}</span>,
    },
    {
      key: 'address',
      header: 'Address / Location',
      sampleTemplateValue: 'Sector 4, Bharuch',
      render: (item) => <span className="text-xs text-slate-600">{item.address}</span>,
    },
    {
      key: 'numberOfRooms',
      header: 'Rooms',
      sortable: true,
      sampleTemplateValue: 6,
      align: 'center',
    },
    {
      key: 'proposedOccupancy',
      header: 'Capacity (Beds)',
      sortable: true,
      sampleTemplateValue: 12,
      align: 'center',
      render: (item) => <span className="font-bold text-blue-700">{item.proposedOccupancy}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            item.status === 'Furnished'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: 'hiringDate',
      header: 'Hiring Date',
      render: (item) => formatDDMMMYYYY(item.hiringDate),
    },
  ];

  // Allotment Register Columns
  const allotmentColumns: ColumnDef<Allotment>[] = [
    {
      key: 'employeeName',
      header: 'Employee Name & ID',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.employeeName}</p>
          <p className="font-mono text-xs text-blue-700">{item.employeeId}</p>
        </div>
      ),
    },
    {
      key: 'allotmentCategory',
      header: 'Category',
      sortable: true,
      filterable: true,
      filterOptions: ['TPL', 'Outsource'],
      render: (item) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            item.allotmentCategory === 'TPL'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-purple-100 text-purple-800'
          }`}
        >
          {item.allotmentCategory}
        </span>
      ),
    },
    {
      key: 'guestHouseName',
      header: 'Guest House & Room',
      sortable: true,
      filterable: true,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">{item.guestHouseName}</p>
          <p className="text-xs text-slate-500">
            Room: <strong className="text-slate-700">{item.roomNo}</strong> ({item.bedNo})
          </p>
        </div>
      ),
    },
    {
      key: 'checkInDate',
      header: 'Check-In Date',
      sortable: true,
      render: (item) => formatDDMMMYYYY(item.checkInDate),
    },
    {
      key: 'expectedCheckOutDate',
      header: 'Exp. Check-Out',
      render: (item) => formatDDMMMYYYY(item.expectedCheckOutDate),
    },
    {
      key: 'status',
      header: 'Allotment Status',
      sortable: true,
      filterable: true,
      filterOptions: ['Active', 'Checked Out'],
      render: (item) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            item.status === 'Active'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          {item.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Workspace C – Staff Accommodation &amp; Guest Houses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Full hotel allotment engine: Guest House inventory, visual room chart, bed allocation,
            and TPL/Outsource occupancy analytics.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('accommodation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'accommodation'
                ? 'bg-white text-purple-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BedDouble className="w-4 h-4 text-purple-600" />
            Accommodation Allotment
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guesthouses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'guesthouses'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Hotel className="w-4 h-4 text-blue-600" />
            Guest House Inventory ({guestHouses.length})
          </button>
        </div>
      </div>

      {/* Sub-view navigation for Accommodation */}
      {activeTab === 'accommodation' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAccommodationSubView('chart')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  accommodationSubView === 'chart'
                    ? 'bg-purple-100 text-purple-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Visual Room Grid
              </button>
              <button
                type="button"
                onClick={() => setAccommodationSubView('register')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  accommodationSubView === 'register'
                    ? 'bg-purple-100 text-purple-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Check-in / Check-out Register
              </button>
              <button
                type="button"
                onClick={() => setAccommodationSubView('rooms')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  accommodationSubView === 'rooms'
                    ? 'bg-purple-100 text-purple-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Hotel className="w-3.5 h-3.5" />
                Room Master ({rooms.length})
              </button>
              <button
                type="button"
                onClick={() => setAccommodationSubView('report')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  accommodationSubView === 'report'
                    ? 'bg-purple-100 text-purple-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Occupancy Analytics
              </button>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={handleOpenAllotment}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                New Staff Allotment (Check-In)
              </button>
            )}
          </div>

          {/* SubView 1: Visual Room Grid */}
          {accommodationSubView === 'chart' && (
            <div className="space-y-6">
              {guestHouses.map((gh) => {
                const ghRooms = rooms.filter((r) => r.guestHouseId === gh.id);

                return (
                  <div
                    key={gh.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Hotel className="w-4 h-4 text-purple-600" />
                          {gh.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{gh.address}</p>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-slate-600">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                          Vacant
                        </span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                          Partial
                        </span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                          Full
                        </span>
                      </div>
                    </div>

                    {/* Room Grid cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {ghRooms.map((room) => {
                        const occupiedCount = room.beds.filter((b) => b.isOccupied).length;
                        const statusColor =
                          room.status === 'Vacant'
                            ? 'border-emerald-300 bg-emerald-50/40'
                            : room.status === 'Partially Occupied'
                            ? 'border-amber-300 bg-amber-50/40'
                            : room.status === 'Occupied'
                            ? 'border-rose-300 bg-rose-50/40'
                            : 'border-slate-300 bg-slate-50';

                        const badgeColor =
                          room.status === 'Vacant'
                            ? 'bg-emerald-100 text-emerald-800'
                            : room.status === 'Partially Occupied'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800';

                        return (
                          <div
                            key={room.id}
                            className={`p-4 rounded-xl border-2 transition ${statusColor} flex flex-col justify-between`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">
                                  {room.roomNo}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                                  {room.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {room.roomType} • Capacity: {room.capacity}
                              </p>

                              {/* Beds list */}
                              <div className="mt-3 space-y-1.5">
                                {room.beds.map((b) => {
                                  const activeAllot = allotments.find(
                                    (a) => a.id === b.currentAllotmentId && a.status === 'Active'
                                  );

                                  return (
                                    <div
                                      key={b.bedNo}
                                      className="p-2 rounded bg-white border border-slate-200 text-xs flex items-center justify-between"
                                    >
                                      <div>
                                        <p className="font-semibold text-slate-800">{b.bedNo}</p>
                                        {activeAllot ? (
                                          <p className="text-[11px] text-blue-700 font-medium truncate max-w-[140px]">
                                            {activeAllot.employeeName} ({activeAllot.allotmentCategory})
                                          </p>
                                        ) : (
                                          <p className="text-[11px] text-emerald-600 font-medium">Available</p>
                                        )}
                                      </div>

                                      {activeAllot && canEdit && (
                                        <button
                                          type="button"
                                          onClick={() => setCheckOutTarget(activeAllot)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                          title="Check-Out this Employee"
                                        >
                                          <LogOut className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SubView 2: Register */}
          {accommodationSubView === 'register' && (
            <DataTable<Allotment>
              title="Staff Accommodation Check-In / Check-Out Register"
              subtitle="Maintains permanent allotment records and freeing of beds on check-out"
              data={allotments}
              columns={allotmentColumns}
              canAdd={canEdit}
              canEdit={false}
              canDelete={canDelete}
              onAdd={handleOpenAllotment}
              onDelete={(item) => {
                if (item.status === 'Active') {
                  alert('Active allotment cannot be deleted directly. Please check out the employee first.');
                  return;
                }
                const updated = allotments.filter((a) => a.id !== item.id);
                setAllotments(updated);
                storage.saveAllotments(updated);
              }}
              customActions={(item) =>
                item.status === 'Active' && canEdit ? (
                  <button
                    type="button"
                    onClick={() => setCheckOutTarget(item)}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded border border-rose-200 flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Check-Out
                  </button>
                ) : null
              }
              exportFileName="EPCC_Accommodation_Register"
            />
          )}

          {/* SubView 3: Room Master */}
          {accommodationSubView === 'rooms' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Room Master Inventory</h3>
                  <p className="text-xs text-slate-500">Configure room types and bed capacities</p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsRoomModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add Room
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase">
                      <th className="p-3">Guest House</th>
                      <th className="p-3">Room No</th>
                      <th className="p-3">Room Type</th>
                      <th className="p-3">Capacity</th>
                      <th className="p-3">Occupied Beds</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {rooms.map((r) => {
                      const occCount = r.beds.filter((b) => b.isOccupied).length;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">{r.guestHouseName}</td>
                          <td className="p-3 font-bold text-blue-700">{r.roomNo}</td>
                          <td className="p-3">{r.roomType}</td>
                          <td className="p-3">{r.capacity} Beds</td>
                          <td className="p-3 font-semibold">{occCount} / {r.capacity}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                r.status === 'Vacant'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.status === 'Occupied'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubView 4: Occupancy Report */}
          {accommodationSubView === 'report' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Report 1: By Guest House */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Occupancy by Guest House</h3>
                <div className="space-y-4">
                  {guestHouses.map((gh) => {
                    const ghRooms = rooms.filter((r) => r.guestHouseId === gh.id);
                    let beds = 0;
                    let occ = 0;
                    ghRooms.forEach((r) => {
                      beds += r.capacity;
                      occ += r.beds.filter((b) => b.isOccupied).length;
                    });
                    const pct = beds > 0 ? Math.round((occ / beds) * 100) : 0;

                    return (
                      <div key={gh.id} className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-800">{gh.name}</span>
                          <span className="text-purple-700">{occ} / {beds} Beds ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-600 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Report 2: By Staff Source (TPL vs Outsource) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Occupancy by Source (TPL vs Outsource)</h3>
                <div className="space-y-4">
                  {(() => {
                    const activeAllots = allotments.filter((a) => a.status === 'Active');
                    const tplAlloted = activeAllots.filter((a) => a.allotmentCategory === 'TPL').length;
                    const outsourceAlloted = activeAllots.filter((a) => a.allotmentCategory === 'Outsource').length;
                    const totalAlloted = activeAllots.length || 1;

                    return (
                      <>
                        <div className="p-3 bg-blue-50/50 rounded-xl space-y-2 border border-blue-100">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-blue-900">TPL Staff Members</span>
                            <span className="text-blue-700">{tplAlloted} ({Math.round((tplAlloted / totalAlloted) * 100)}%)</span>
                          </div>
                          <div className="w-full bg-blue-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${(tplAlloted / totalAlloted) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-purple-50/50 rounded-xl space-y-2 border border-purple-100">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-purple-900">Outsourced Contract Staff</span>
                            <span className="text-purple-700">{outsourceAlloted} ({Math.round((outsourceAlloted / totalAlloted) * 100)}%)</span>
                          </div>
                          <div className="w-full bg-purple-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-purple-600 h-full rounded-full"
                              style={{ width: `${(outsourceAlloted / totalAlloted) * 100}%` }}
                            />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guest House Details Tab */}
      {activeTab === 'guesthouses' && (
        <DataTable<GuestHouse>
          title="Guest House Master & Facilities Register"
          subtitle="Inventory of residential bungalows, lease periods and detailed furniture/appliance amenities"
          data={guestHouses}
          columns={ghColumns}
          canAdd={canEdit}
          canEdit={canEdit}
          canDelete={canDelete}
          onAdd={handleOpenAddGH}
          onEdit={handleOpenEditGH}
          onDelete={(item) => {
            const hasOccupants = allotments.some(
              (a) => a.guestHouseId === item.id && a.status === 'Active'
            );
            if (hasOccupants) {
              alert('Cannot delete guest house with active occupants! Please check out all residents first.');
              return;
            }
            const updated = guestHouses.filter((g) => g.id !== item.id);
            setGuestHouses(updated);
            storage.saveGuestHouses(updated);
          }}
          exportFileName="EPCC_Guest_Houses"
        />
      )}

      {/* Check In / Allotment Modal */}
      <Modal
        isOpen={isAllotmentModalOpen}
        onClose={() => setIsAllotmentModalOpen(false)}
        title="Staff Accommodation Allotment (Check-In)"
        subtitle="Only shows vacant rooms and beds. One employee can hold only one active bed."
        maxWidth="xl"
      >
        <form onSubmit={handleSaveAllotment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Select Guest House <span className="text-red-500">*</span>
              </label>
              <select
                value={allotmentFormData.guestHouseId}
                onChange={(e) => {
                  const ghId = e.target.value;
                  const firstRoom = rooms.find(
                    (r) => r.guestHouseId === ghId && r.beds.some((b) => !b.isOccupied)
                  );
                  const firstBed = firstRoom?.beds.find((b) => !b.isOccupied)?.bedNo || '';
                  setAllotmentFormData({
                    ...allotmentFormData,
                    guestHouseId: ghId,
                    roomId: firstRoom?.id || '',
                    bedNo: firstBed,
                  });
                }}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-semibold"
              >
                {guestHouses.map((gh) => (
                  <option key={gh.id} value={gh.id}>
                    {gh.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Vacant Room <span className="text-red-500">*</span>
              </label>
              <select
                value={allotmentFormData.roomId}
                onChange={(e) => {
                  const rId = e.target.value;
                  const room = rooms.find((r) => r.id === rId);
                  const firstBed = room?.beds.find((b) => !b.isOccupied)?.bedNo || '';
                  setAllotmentFormData({
                    ...allotmentFormData,
                    roomId: rId,
                    bedNo: firstBed,
                  });
                }}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-semibold"
              >
                {availableRoomsForGH.length === 0 ? (
                  <option value="">No vacant rooms in this guest house</option>
                ) : (
                  availableRoomsForGH.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomNo} ({r.roomType} - {r.beds.filter((b) => !b.isOccupied).length} beds free)
                    </option>
                  ))
                )}
              </select>
              {allotmentErrors.roomId && (
                <p className="text-xs text-red-600 mt-1">{allotmentErrors.roomId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Available Bed <span className="text-red-500">*</span>
              </label>
              <select
                value={allotmentFormData.bedNo}
                onChange={(e) =>
                  setAllotmentFormData({ ...allotmentFormData, bedNo: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-medium"
              >
                {availableBeds.length === 0 ? (
                  <option value="">No beds available</option>
                ) : (
                  availableBeds.map((b) => (
                    <option key={b.bedNo} value={b.bedNo}>
                      {b.bedNo}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Employee (Active Staff Master) <span className="text-red-500">*</span>
              </label>
              <select
                value={allotmentFormData.staffId}
                onChange={(e) =>
                  setAllotmentFormData({ ...allotmentFormData, staffId: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-medium"
              >
                <option value="">-- Choose Employee --</option>
                {activeStaffMembers.map((s) => {
                  const isAllotted = activeAllotmentEmpIds.has(s.employeeId);
                  return (
                    <option
                      key={s.id}
                      value={s.id}
                      disabled={isAllotted}
                      className={isAllotted ? 'text-slate-400' : 'text-slate-900 font-semibold'}
                    >
                      {s.name} ({s.employeeId} - {s.source}) {isAllotted ? '[Already Allotted]' : ''}
                    </option>
                  );
                })}
              </select>
              {allotmentErrors.staffId && (
                <p className="text-xs text-red-600 mt-1">{allotmentErrors.staffId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Check-In Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={allotmentFormData.checkInDate}
                onChange={(e) =>
                  setAllotmentFormData({ ...allotmentFormData, checkInDate: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Expected Check-Out Date
              </label>
              <input
                type="date"
                value={allotmentFormData.expectedCheckOutDate}
                onChange={(e) =>
                  setAllotmentFormData({ ...allotmentFormData, expectedCheckOutDate: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">Remarks</label>
            <input
              type="text"
              value={allotmentFormData.remarks}
              onChange={(e) =>
                setAllotmentFormData({ ...allotmentFormData, remarks: e.target.value })
              }
              placeholder="Allotment order reference, project site assignment..."
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAllotmentModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
            >
              Confirm Allotment &amp; Check-In
            </button>
          </div>
        </form>
      </Modal>

      {/* Check Out Confirmation Dialog */}
      <Modal
        isOpen={Boolean(checkOutTarget)}
        onClose={() => setCheckOutTarget(null)}
        title="Confirm Employee Check-Out"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-xs">
            Confirm check-out for <strong>{checkOutTarget?.employeeName}</strong> ({checkOutTarget?.employeeId})
            from <strong>{checkOutTarget?.guestHouseName}</strong> Room {checkOutTarget?.roomNo} -{' '}
            {checkOutTarget?.bedNo}?
            <p className="mt-1 font-semibold text-emerald-800">
              The bed will be released immediately and made available for new allotments.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCheckOutTarget(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmCheckOut}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
            >
              Confirm Check-Out
            </button>
          </div>
        </div>
      </Modal>

      {/* Guest House Add / Edit Modal with Amenities Matrix */}
      <Modal
        isOpen={isGHModalOpen}
        onClose={() => setIsGHModalOpen(false)}
        title={editingGH ? 'Edit Guest House' : 'Add New Guest House'}
        subtitle="Manage property hiring details and room amenities register"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveGH} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Name of Guest House <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={ghFormData.name}
                onChange={(e) => setGHFormData({ ...ghFormData, name: e.target.value })}
                placeholder="e.g. Narmada Officers Enclave"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Status</label>
              <select
                value={ghFormData.status}
                onChange={(e) =>
                  setGHFormData({ ...ghFormData, status: e.target.value as any })
                }
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Furnished">Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Full Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={ghFormData.address}
              onChange={(e) => setGHFormData({ ...ghFormData, address: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Number of Rooms</label>
              <input
                type="number"
                min={1}
                value={ghFormData.numberOfRooms}
                onChange={(e) => setGHFormData({ ...ghFormData, numberOfRooms: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Proposed Occupancy</label>
              <input
                type="number"
                min={1}
                value={ghFormData.proposedOccupancy}
                onChange={(e) => setGHFormData({ ...ghFormData, proposedOccupancy: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Date of Hiring</label>
              <input
                type="date"
                value={ghFormData.hiringDate}
                onChange={(e) => setGHFormData({ ...ghFormData, hiringDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Date of De-Hiring</label>
              <input
                type="date"
                value={ghFormData.dehiringDate}
                onChange={(e) => setGHFormData({ ...ghFormData, dehiringDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Room Facilities / Amenities Checklist */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Inventory Facilities (Quantities &amp; Amenities)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { key: 'singleBed', label: 'Single Bed (Nos)' },
                { key: 'doubleBed', label: 'Double Bed (Nos)' },
                { key: 'bunkBed', label: 'Bunk Bed (Nos)' },
                { key: 'mattress', label: 'Mattress (Nos)' },
                { key: 'ceilingFan', label: 'Ceiling Fan (Nos)' },
                { key: 'acSplit', label: 'AC Split (Nos)' },
                { key: 'acWindow', label: 'AC Window (Nos)' },
                { key: 'desertCooler', label: 'Desert Cooler' },
                { key: 'sofa3Seater', label: 'Sofa 3-Seater' },
                { key: 'sofa5Seater', label: 'Sofa 5-Seater' },
                { key: 'geyser', label: 'Geyser (Nos)' },
                { key: 'refrigerator', label: 'Refrigerator' },
                { key: 'studyTable', label: 'Study Table' },
                { key: 'studyChair', label: 'Study Chair' },
                { key: 'sideTable', label: 'Side Table (Nos)' },
                { key: 'centreTable', label: 'Centre Table' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-[11px] text-slate-600 font-medium">{f.label}</label>
                  <input
                    type="number"
                    min={0}
                    value={(ghFormData.facilities as any)[f.key] || 0}
                    onChange={(e) =>
                      setGHFormData({
                        ...ghFormData,
                        facilities: {
                          ...ghFormData.facilities,
                          [f.key]: Number(e.target.value),
                        },
                      })
                    }
                    className="mt-0.5 w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 font-medium">Facilities Remarks</label>
              <input
                type="text"
                value={ghFormData.facilities.remarks || ''}
                onChange={(e) =>
                  setGHFormData({
                    ...ghFormData,
                    facilities: { ...ghFormData.facilities, remarks: e.target.value },
                  })
                }
                placeholder="Wi-Fi router, RO purifier, DG backup..."
                className="mt-0.5 w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsGHModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              {editingGH ? 'Update Guest House' : 'Save Guest House'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Room Modal */}
      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        title="Add Room to Guest House"
        maxWidth="md"
      >
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">Guest House</label>
            <select
              value={roomFormData.guestHouseId}
              onChange={(e) => setRoomFormData({ ...roomFormData, guestHouseId: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            >
              {guestHouses.map((gh) => (
                <option key={gh.id} value={gh.id}>
                  {gh.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">Room Number</label>
            <input
              type="text"
              required
              value={roomFormData.roomNo}
              onChange={(e) => setRoomFormData({ ...roomFormData, roomNo: e.target.value })}
              placeholder="e.g. Room 104"
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">Room Type</label>
            <select
              value={roomFormData.roomType}
              onChange={(e) =>
                setRoomFormData({ ...roomFormData, roomType: e.target.value as RoomType })
              }
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-semibold"
            >
              <option value="Single">Single (1 Bed)</option>
              <option value="Double">Double (2 Beds)</option>
              <option value="Quad">Quad (4 Beds)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRoomModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Add Room
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
