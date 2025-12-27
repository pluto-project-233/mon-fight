## 📘 `docs/elemental-affinity.md`

### Tujuan

Mendefinisikan **kecocokan elemen** untuk perhitungan damage.

---

### Element Types

* FIRE
* WATER
* GRASS
* LIGHT
* DARK

---

### Affinity Matrix (Conceptual)

| Attacker | Defender | Multiplier |
| -------- | -------- | ---------- |
| FIRE     | GRASS    | 1.5x       |
| GRASS    | WATER    | 1.5x       |
| WATER    | FIRE     | 1.5x       |
| LIGHT    | DARK     | 1.3x       |
| DARK     | LIGHT    | 1.3x       |
| Same     | Same     | 1.0x       |

---

### Damage Formula (High-Level)

```
FinalDamage =
  BaseDamage
  × ElementMultiplier
  × SkillModifier
```

---

### Design Rule

* Elemental matrix:

  * Centralized
  * Read-only
* DamageCalculator hanya **mengonsumsi**, bukan mendefinisikan matrix