## 📘 `docs/skill-system.md`

### Tujuan

Mendefinisikan sistem **skill monster** yang modular dan scalable.

---

### Skill Categories

#### 1. Passive Skill

* Selalu aktif
* Contoh:

  * Bonus damage
  * Bonus charge

#### 2. Active Skill

* Dipicu otomatis saat meter penuh
* Tidak ada manual input (MVP)

---

### Skill Trigger Timing

Skill hanya boleh trigger pada phase berikut:

* `ON_MATCH`
* `ON_CHARGE`
* `ON_ATTACK`
* `ON_TURN_START`

---

### Skill Constraints (IMPORTANT)

* Skill **tidak boleh**:

  * Mengubah board langsung
  * Mengubah RNG
  * Mengakses WebSocket

Skill hanya menerima:

```
(GameState, PlayerState) → Modifier
```

---

### Skill Resolution Flow

```
Resolve Puzzle
 → Accumulate charge
 → Check skill ready
 → Apply skill effect
 → Proceed to damage
```

---

### Extensibility Rule

* Skill ditambahkan via config / registry
* Tidak hardcoded di TurnResolver

---