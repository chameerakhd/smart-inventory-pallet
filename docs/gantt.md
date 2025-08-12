```mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Planning
    Decide & Present Idea        :a1, 2025-08-12, 7d
    Requirement Analysis         :a2, after a1, 7d
    System Architecture Design   :a3, after a2, 7d
    section Phase 2: Hardware Research
    Hardware Research & Prototype Planning :a4, after a3, 7d
    Hardware Assembly & Load Cell Display  :a5, after a4, 7d
    Calibration                  :a6, after a5, 7d
    section Phase 3: NFC Integration
    NFC Research & Feasibility   :a7, after a3, 7d
    NFC Purchase & Testing       :a8, after a7, 7d
    Integration                  :a9, after a6, 7d
    section Phase 4: Cloud Integration
    Cloud SaaS Integration       :a10, after a9, 7d
    section Phase 5: Finalization
    Testing & Bug Fixes          :a11, after a10, 7d
    Documentation & Presentation :a12, after a11, 7d
