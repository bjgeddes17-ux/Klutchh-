sed -i.bak '/<View style={styles.uploadOptionsRow}>/i\
              <View style={styles.accuracyWarning}>\
                <Camera color="#38bdf8" size={14} />\
                <Text style={styles.accuracyWarningText}>For highest tracking accuracy, use the Live Camera outdoors or in bright lighting.</Text>\
              </View>' src/App.native.tsx
