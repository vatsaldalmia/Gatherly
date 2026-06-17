import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMeetups, getMeetup, createMeetup, deleteMeetup } from "./meetups.functions";
import { addParticipant, updateParticipant } from "./participants.functions";
import { castVote, removeVote, finalizeMeetup } from "./votes.functions";
import { calculateAreas } from "./fairness.functions";

// Centralised query key factory — consistent cache invalidation
export const meetupKeys = {
  all: ["meetups"] as const,
  list: () => [...meetupKeys.all, "list"] as const,
  detail: (id: string) => [...meetupKeys.all, "detail", id] as const,
};

export function useMeetupsListQuery() {
  return useQuery({
    queryKey: meetupKeys.list(),
    queryFn: () => listMeetups(),
    staleTime: 30_000,
  });
}

export function useMeetupQuery(id: string | undefined) {
  return useQuery({
    queryKey: meetupKeys.detail(id!),
    queryFn: () => getMeetup({ data: { id: id! } }),
    enabled: !!id,
    staleTime: 5_000,
    refetchInterval: 15_000, // Poll until WebSockets are added
  });
}

export function useCreateMeetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createMeetup>[0]["data"]) =>
      createMeetup({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: meetupKeys.list() }),
  });
}

export function useDeleteMeetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMeetup({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: meetupKeys.list() }),
  });
}

export function useAddParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof addParticipant>[0]["data"]) =>
      addParticipant({ data: input }),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: meetupKeys.detail(vars.meetupId) }),
  });
}

export function useUpdateParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof updateParticipant>[0]["data"]) =>
      updateParticipant({ data: input }),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: meetupKeys.detail(vars.meetupId) }),
  });
}

export function useCastVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof castVote>[0]["data"]) =>
      castVote({ data: input }),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: meetupKeys.detail(vars.meetupId) }),
  });
}

export function useRemoveVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof removeVote>[0]["data"]) =>
      removeVote({ data: input }),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: meetupKeys.detail(vars.meetupId) }),
  });
}

export function useCalculateAreas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meetupId: string) => calculateAreas({ data: { meetupId } }),
    onSuccess: (_, meetupId) =>
      qc.invalidateQueries({ queryKey: meetupKeys.detail(meetupId) }),
  });
}

export function useFinalizeMeetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof finalizeMeetup>[0]["data"]) =>
      finalizeMeetup({ data: input }),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: meetupKeys.detail(vars.meetupId) }),
  });
}
