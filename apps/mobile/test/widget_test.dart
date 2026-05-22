import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';

import 'package:stitchd_mobile/main.dart';

void main() {
  testWidgets('STITCHD shell renders main navigation', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1440, 2200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const StitchdApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Home'), findsWidgets);
    expect(find.text('Browse all services'), findsOneWidget);
  });
}
