// features/users/types.ts

export interface Persona {
  id?: number; // ada jika persona ini sudah tersimpan di backend; kosong jika baru dibuat di form
  name: string;
  workTitle?: string;
  avatarUrl?: string;
  age?: string;
  location?: string;
  familyStatus?: string;
  about?: string;
  goals?: string;
  frustrations?: string;
}

export interface UserType {
  id: string;
  name: string;
  description: string;
  storiesCount?: number;
  personasCount?: number;
  personas?: Persona[];
  deletedPersonaIds?: number[]; // dipakai UserFormPanel untuk menandai persona yang dihapus saat edit
}