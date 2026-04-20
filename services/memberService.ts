import { Member } from '../types';

const STORAGE_KEY = 'clarity_members';

const getMembers = (): Member[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveMembers = (members: Member[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
};

export const memberService = {
  async fetchMembers(): Promise<Member[]> {
    return getMembers().filter(m => !m.isDeleted);
  },

  async fetchDeletedMembers(): Promise<Member[]> {
    return getMembers().filter(m => m.isDeleted);
  },

  async createMember(member: Member): Promise<Member> {
    const members = getMembers();
    const newMember: Member = {
      ...member,
      id: member.id || crypto.randomUUID(),
      createdAt: member.createdAt || Date.now(),
      subscriptions: member.subscriptions || [],
    };
    members.push(newMember);
    saveMembers(members);
    return newMember;
  },

  async updateMember(member: Member): Promise<Member> {
    const members = getMembers();
    const index = members.findIndex(m => m.id === member.id);
    if (index === -1) throw new Error('Member not found');
    
    members[index] = { ...member };
    saveMembers(members);
    return members[index];
  },

  async deleteMember(id: string): Promise<boolean> {
    const members = getMembers();
    const index = members.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    members[index].isDeleted = true;
    saveMembers(members);
    return true;
  },

  async restoreMember(id: string): Promise<boolean> {
    const members = getMembers();
    const index = members.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    members[index].isDeleted = false;
    saveMembers(members);
    return true;
  }
};
