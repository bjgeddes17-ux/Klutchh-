sed -i.bak '/\/\/ Adaptive alpha based on speed\/displacement/i\
    \/\/ Arm\/Wrist landmarks (13-22) need to be completely responsive (0 lag)\n    if (idx >= 11 && idx <= 22) {\n      return curr;\n    }\n' src/utils/geometry.ts
