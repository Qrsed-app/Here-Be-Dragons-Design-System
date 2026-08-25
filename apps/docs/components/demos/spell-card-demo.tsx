import { SpellCard } from '@/registry/new-york/spell-card/spell-card';

// SpellCard wraps its `children` (the description) in a <p>. In MDX, loose text
// children get wrapped in a <p> too, producing an invalid <p><p>…</p></p>. In a
// .tsx the text child stays a plain string, so these demos render correctly.

export function SpellCardSchoolsDemo() {
  return (
    <>
      <SpellCard
        name="Fireball"
        level="3"
        school="evocation"
        castingTime="1 action"
        range="150 feet"
        components="V, S, M"
        duration="Instantaneous"
      >
        A bright streak flashes to a point you choose, then blossoms into an explosion of flame.
      </SpellCard>
      <SpellCard
        name="Counterspell"
        level="3"
        school="abjuration"
        castingTime="1 reaction"
        range="60 feet"
        components="S"
        duration="Instantaneous"
      >
        You attempt to interrupt a creature in the process of casting a spell.
      </SpellCard>
      <SpellCard
        name="Charm Person"
        level="1"
        school="enchantment"
        castingTime="1 action"
        range="30 feet"
        components="V, S"
        duration="1 hour"
      >
        You attempt to charm a humanoid you can see within range.
      </SpellCard>
    </>
  );
}

export function SpellCardLevelsDemo() {
  return (
    <>
      <SpellCard
        name="Fire Bolt"
        level="cantrip"
        school="evocation"
        castingTime="1 action"
        range="120 feet"
        components="V, S"
        duration="Instantaneous"
      >
        You hurl a mote of fire at a creature or object within range.
      </SpellCard>
      <SpellCard
        name="Wish"
        level="9"
        school="conjuration"
        castingTime="1 action"
        range="Self"
        components="V"
        duration="Instantaneous"
      >
        The mightiest spell a mortal creature can cast.
      </SpellCard>
    </>
  );
}

export function SpellCardTagsDemo() {
  return (
    <>
      <SpellCard
        name="Detect Magic"
        level="1"
        school="divination"
        castingTime="1 action"
        range="Self"
        components="V, S"
        duration="Concentration, up to 10 minutes"
        ritual
        concentration
      >
        You sense the presence of magic within 30 feet of you.
      </SpellCard>
      <SpellCard
        name="Hold Person"
        level="2"
        school="enchantment"
        castingTime="1 action"
        range="60 feet"
        components="V, S, M"
        duration="Concentration, up to 1 minute"
        concentration
        selected
      >
        Choose a humanoid that you can see within range; the target must succeed on a Wisdom saving
        throw or be paralyzed.
      </SpellCard>
    </>
  );
}

export function SpellCardHigherLevelsDemo() {
  return (
    <SpellCard
      name="Magic Missile"
      level="1"
      school="evocation"
      castingTime="1 action"
      range="120 feet"
      components="V, S"
      duration="Instantaneous"
      higherLevels="The spell creates one more dart for each slot level above 1st."
      footer="Player's Handbook · p. 257"
    >
      You create three glowing darts of magical force, each dealing 1d4 + 1 force damage.
    </SpellCard>
  );
}
