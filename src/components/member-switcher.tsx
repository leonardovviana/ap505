import { Select } from "@/components/ui/field";
import type { CoupleMember } from "@/types/app";

export function MemberSwitcher({
  members,
  defaultValue,
}: {
  members: CoupleMember[];
  defaultValue?: string;
}) {
  return (
    <Select name="member_id" defaultValue={defaultValue ?? members[0]?.id} required>
      {members.map((member) => (
        <option key={member.id} value={member.id}>
          {member.display_name}
        </option>
      ))}
    </Select>
  );
}
