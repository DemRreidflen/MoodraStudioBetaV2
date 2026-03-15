import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Character } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Edit, User, Crown, Star } from "lucide-react";

const ROLES = [
  { value: "protagonist", label: "Главный герой", icon: Crown, color: "text-yellow-500" },
  { value: "antagonist", label: "Антагонист", icon: Star, color: "text-red-500" },
  { value: "secondary", label: "Второстепенный", icon: User, color: "text-blue-500" },
];

function CharacterCard({ char, onEdit, onDelete }: {
  char: Character;
  onEdit: (c: Character) => void;
  onDelete: (id: number) => void;
}) {
  const role = ROLES.find(r => r.value === char.role) || ROLES[2];
  const Icon = role.icon;

  return (
    <div
      data-testid={`character-card-${char.id}`}
      className="group bg-card border border-card-border rounded-xl p-4 transition-all hover:border-primary/30"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-base font-bold text-primary">{char.name[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-sm truncate">{char.name}</h3>
            <Badge variant="secondary" className={`text-xs ${role.color} bg-transparent border-0 px-0`}>
              <Icon className="h-3 w-3 mr-1" />
              {role.label}
            </Badge>
          </div>
          {char.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{char.description}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {char.traits && char.traits.split(",").slice(0, 3).map(t => t.trim()).filter(Boolean).map(trait => (
              <Badge key={trait} variant="secondary" className="text-xs h-4 px-1.5">{trait}</Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(char)}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:text-destructive"
            onClick={() => onDelete(char.id)}
            data-testid={`delete-character-${char.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CharacterDialog({
  open, onClose, bookId, character
}: { open: boolean; onClose: () => void; bookId: number; character?: Character }) {
  const { toast } = useToast();
  const [name, setName] = useState(character?.name || "");
  const [role, setRole] = useState(character?.role || "secondary");
  const [description, setDescription] = useState(character?.description || "");
  const [traits, setTraits] = useState(character?.traits || "");
  const [goals, setGoals] = useState(character?.goals || "");
  const [biography, setBiography] = useState(character?.biography || "");

  const createMutation = useMutation({
    mutationFn: (data: any) => character
      ? apiRequest("PATCH", `/api/characters/${character.id}`, data)
      : apiRequest("POST", `/api/books/${bookId}/characters`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "characters"] });
      onClose();
      toast({ title: character ? "Персонаж обновлён" : "Персонаж создан" });
    },
    onError: () => toast({ title: "Ошибка", variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), role, description, traits, goals, biography });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-card-border">
        <DialogHeader>
          <DialogTitle>{character ? "Редактировать персонажа" : "Новый персонаж"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Имя</Label>
              <Input
                data-testid="input-character-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Имя персонажа"
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Роль</Label>
              <div className="flex gap-1">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`flex-1 text-xs py-1.5 rounded-md border transition-all ${
                      role === r.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Описание</Label>
            <Textarea
              data-testid="input-character-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Краткое описание персонажа"
              rows={2}
              className="bg-background resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Черты характера (через запятую)</Label>
            <Input
              data-testid="input-character-traits"
              value={traits}
              onChange={e => setTraits(e.target.value)}
              placeholder="смелый, умный, импульсивный"
              className="bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Цели и мотивация</Label>
            <Textarea
              value={goals}
              onChange={e => setGoals(e.target.value)}
              placeholder="Чего хочет этот персонаж?"
              rows={2}
              className="bg-background resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Биография</Label>
            <Textarea
              value={biography}
              onChange={e => setBiography(e.target.value)}
              placeholder="История жизни персонажа"
              rows={3}
              className="bg-background resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || createMutation.isPending} data-testid="button-save-character">
              {createMutation.isPending ? "Сохраняю..." : "Сохранить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CharactersPanel({ bookId }: { bookId: number }) {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editChar, setEditChar] = useState<Character | undefined>();

  const { data: characters = [], isLoading } = useQuery<Character[]>({
    queryKey: ["/api/books", bookId, "characters"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/characters`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/characters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "characters"] });
      toast({ title: "Персонаж удалён" });
    },
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Персонажи
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">{characters.length} персонажей</p>
        </div>
        <Button
          onClick={() => { setEditChar(undefined); setShowDialog(true); }}
          data-testid="button-add-character"
          gap-2
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Новый персонаж
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : characters.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold mb-2">Нет персонажей</h3>
              <p className="text-muted-foreground text-sm mb-4">Создайте персонажей для вашей книги</p>
              <Button onClick={() => setShowDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Создать персонажа
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {characters.map(char => (
                <CharacterCard
                  key={char.id}
                  char={char}
                  onEdit={c => { setEditChar(c); setShowDialog(true); }}
                  onDelete={id => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <CharacterDialog
        open={showDialog}
        onClose={() => { setShowDialog(false); setEditChar(undefined); }}
        bookId={bookId}
        character={editChar}
      />
    </div>
  );
}
