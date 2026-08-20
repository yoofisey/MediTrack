"use client";

import { useMemo } from "react";
import { CSS } from "@/lib/constants";
import { useSwipe } from "@/lib/useSwipe";
import { Trophy, Star, Target, Award, Flame, Zap, Medal } from "lucide-react";
import { BADGES, CHALLENGES, checkBadges, getTotalPoints, getChallengeProgress, getEarnedBadges } from "@/lib/gamification";
import { streak } from "@/lib/household";

const CATEGORY_META = {
  getting_started: { label: "Getting Started", color: "var(--teal)" },
  streak: { label: "Streaks", color: "var(--orange)" },
  journal: { label: "Journal", color: "#AF52DE" },
  adherence: { label: "Adherence", color: "#34C759" },
  vitals: { label: "Vitals", color: "#FF2D55" },
  family: { label: "Family", color: "#007AFF" },
  special: { label: "Special", color: "var(--teal2)" },
};

function Ico({ children, ...props }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }} {...props}>{children}</span>
  );
}

function PointsCard({ points, currentStreak }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, var(--teal), var(--teal2))",
      borderRadius: "var(--rxl)",
      padding: "28px 24px",
      margin: "0 20px 20px",
      boxShadow: "0 4px 20px rgba(0,0,0,.15)",
      color: "white",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,.1)" }} />
      <div style={{ position: "absolute", bottom: -30, right: 30, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <Trophy size={22} strokeWidth={2.2} />
        <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.85, letterSpacing: ".5px", textTransform: "uppercase" }}>Total Points</span>
      </div>
      <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, marginBottom: 12 }}>
        {points.toLocaleString()}
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Flame size={15} strokeWidth={2.2} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{currentStreak} day streak</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Star size={15} strokeWidth={2.2} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{CHALLENGES.length} challenges</span>
        </div>
      </div>
    </div>
  );
}

function BadgeItem({ badge, earned }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      padding: "14px 8px",
      borderRadius: "var(--rl)",
      background: earned ? "var(--card)" : "var(--hover)",
      boxShadow: earned ? "var(--card-shadow)" : "none",
      border: earned ? "var(--card-border)" : "1px solid transparent",
      opacity: earned ? 1 : 0.4,
      transition: "all .2s",
      minWidth: 0,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: earned ? "var(--ib5)" : "var(--hover)",
        display: "grid",
        placeItems: "center",
        fontSize: 24,
        filter: earned ? "none" : "grayscale(1)",
      }}>
        {badge.icon}
      </div>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: "var(--t1)",
        textAlign: "center",
        lineHeight: 1.3,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        width: "100%",
      }}>
        {badge.title}
      </div>
      {earned && (
        <div style={{
          fontSize: 9,
          fontWeight: 700,
          color: "var(--teal)",
          background: "var(--ib5)",
          padding: "2px 8px",
          borderRadius: 99,
          textTransform: "uppercase",
          letterSpacing: ".5px",
        }}>
          Earned
        </div>
      )}
    </div>
  );
}

function BadgeGrid({ earnedIds }) {
  const grouped = useMemo(() => {
    const map = {};
    BADGES.forEach(b => {
      if (!map[b.category]) map[b.category] = [];
      map[b.category].push(b);
    });
    return map;
  }, []);

  return (
    <div className="section" style={{ marginBottom: 16 }}>
      <div className="section-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Ico><Award size={16} strokeWidth={2.2} color="var(--t1)" /></Ico>
        Badges
        <span style={{ fontSize: 12, color: "var(--t3)", fontWeight: 500, marginLeft: "auto" }}>
          {earnedIds.length}/{BADGES.length}
        </span>
      </div>
      {Object.entries(grouped).map(([cat, badges]) => {
        const meta = CATEGORY_META[cat] || { label: cat, color: "var(--t3)" };
        return (
          <div key={cat} style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: meta.color,
              textTransform: "uppercase",
              letterSpacing: ".5px",
              padding: "0 16px",
              marginBottom: 8,
            }}>
              {meta.label}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              padding: "0 16px",
            }}>
              {badges.map(b => (
                <BadgeItem key={b.id} badge={b} earned={earnedIds.includes(b.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChallengeCard({ challenge, progress }) {
  const colors = {
    streak: { bar: "var(--orange)", bg: "var(--ib3)" },
    journal: { bar: "#AF52DE", bg: "var(--ib2)" },
    vitals: { bar: "#FF2D55", bg: "var(--ib6)" },
  };
  const c = colors[challenge.type] || colors.streak;

  return (
    <div className="card" style={{
      padding: "16px",
      marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: c.bg,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}>
          {progress.completed ? (
            <Medal size={20} strokeWidth={2} color={c.bar} />
          ) : (
            <Target size={20} strokeWidth={2} color={c.bar} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>{challenge.title}</div>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: progress.completed ? "white" : c.bar,
              background: progress.completed ? c.bar : c.bg,
              padding: "2px 7px",
              borderRadius: 99,
            }}>
              {progress.completed ? "Done" : `+${challenge.reward} pts`}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--t3)", marginBottom: 10 }}>{challenge.desc}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              flex: 1,
              height: 6,
              borderRadius: 99,
              background: "var(--hover)",
              overflow: "hidden",
            }}>
              <div style={{
                width: `${progress.pct}%`,
                height: "100%",
                borderRadius: 99,
                background: progress.completed ? "#34C759" : c.bar,
                transition: "width .4s ease",
              }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t3)", whiteSpace: "nowrap" }}>
              {progress.current}/{progress.goal}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChallengesSection({ member }) {
  const challenges = useMemo(() => {
    return CHALLENGES.map(ch => ({
      challenge: ch,
      progress: getChallengeProgress(ch.id, member),
    }));
  }, [member]);

  return (
    <div className="section" style={{ marginBottom: 16 }}>
      <div className="section-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Ico><Target size={16} strokeWidth={2.2} color="var(--t1)" /></Ico>
        Challenges
        <span style={{ fontSize: 12, color: "var(--t3)", fontWeight: 500, marginLeft: "auto" }}>
          {challenges.filter(c => c.progress.completed).length}/{CHALLENGES.length}
        </span>
      </div>
      <div style={{ padding: "0 16px" }}>
        {challenges.map(({ challenge, progress }) => (
          <ChallengeCard key={challenge.id} challenge={challenge} progress={progress} />
        ))}
      </div>
    </div>
  );
}

function RecentAchievements({ earnedIds }) {
  const recent = useMemo(() => {
    return getEarnedBadges(earnedIds).slice(-5).reverse();
  }, [earnedIds]);

  if (recent.length === 0) {
    return (
      <div className="section" style={{ marginBottom: 16 }}>
        <div className="section-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Ico><Zap size={16} strokeWidth={2.2} color="var(--t1)" /></Ico>
          Recent Achievements
        </div>
        <div className="empty-state" style={{ padding: "24px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 4 }}>No badges yet</div>
          <div style={{ fontSize: 12, color: "var(--t3)" }}>Start logging doses to earn your first badge!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="section" style={{ marginBottom: 16 }}>
      <div className="section-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Ico><Zap size={16} strokeWidth={2.2} color="var(--t1)" /></Ico>
        Recent Achievements
      </div>
      <div style={{ padding: "0 16px" }}>
        {recent.map((badge, i) => {
          const meta = CATEGORY_META[badge.category] || { label: badge.category, color: "var(--t3)" };
          return (
            <div key={badge.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              borderBottom: i < recent.length - 1 ? "1px solid var(--sep)" : "none",
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--ib5)",
                display: "grid",
                placeItems: "center",
                fontSize: 20,
                flexShrink: 0,
              }}>
                {badge.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>{badge.title}</div>
                <div style={{ fontSize: 12, color: "var(--t3)" }}>{badge.desc}</div>
              </div>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                color: meta.color,
                background: `${meta.color}14`,
                padding: "3px 8px",
                borderRadius: 99,
                flexShrink: 0,
              }}>
                {meta.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GamificationTab({ user, profile, member, onBack }) {
  const earnedIds = useMemo(() => checkBadges(member), [member]);
  const points = useMemo(() => getTotalPoints(member), [member]);
  const currentStreak = useMemo(() => streak(member), [member]);
  const backSwipe = useSwipe({ onSwipeRight: onBack });

  return (
    <div className="scroll" {...backSwipe}>
      <style>{CSS}</style>

      <div style={{display:"flex",alignItems:"center",gap:6,padding:"12px 8px 4px"}}>
        {onBack && <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",padding:6,color:"var(--teal)",display:"flex",alignItems:"center"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>}
        <div className="nav-large" style={{padding:0}}>Achievements</div>
      </div>

      <PointsCard points={points} currentStreak={currentStreak} />

      <ChallengesSection member={member} />

      <BadgeGrid earnedIds={earnedIds} />

      <RecentAchievements earnedIds={earnedIds} />

      <div style={{ height: 24 }} />
    </div>
  );
}
