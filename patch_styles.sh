sed -i.bak '/uploadButtonsGrid: {/i\
  accuracyWarning: {\
    flexDirection: "row",\
    alignItems: "center",\
    gap: 8,\
    backgroundColor: "rgba(56, 189, 248, 0.1)",\
    borderWidth: 1,\
    borderColor: "rgba(56, 189, 248, 0.3)",\
    padding: 12,\
    borderRadius: 12,\
    marginBottom: 12,\
  },\
  accuracyWarningText: {\
    color: "#38bdf8",\
    fontSize: 11,\
    fontWeight: "700",\
    flex: 1,\
  },' src/App.native.tsx
