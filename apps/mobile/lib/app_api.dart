import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

class KaziApiException implements Exception {
  const KaziApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class KaziApiClient {
  KaziApiClient({String? baseUrl}) : baseUrl = baseUrl ?? _resolveBaseUrl();

  final String baseUrl;

  static String _resolveBaseUrl() {
    const override = String.fromEnvironment('KAZI_API_BASE_URL');
    if (override.isNotEmpty) {
      return override;
    }

    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3001/api/v1';
    }

    return 'http://127.0.0.1:3001/api/v1';
  }

  Future<void> sendOtp(String phone) async {
    await _request(
      'POST',
      '/auth/send-otp',
      body: {'phone': phone},
    );
  }

  Future<KaziSession> verifyOtp({
    required String phone,
    required String code,
    required String role,
  }) async {
    final payload = await _request(
      'POST',
      '/auth/verify-otp',
      body: {
        'phone': phone,
        'code': code,
        'role': role,
      },
    ) as Map<String, dynamic>;

    return KaziSession.fromJson(payload);
  }

  Future<ApiUser> getMe(String accessToken) async {
    final payload = await _request('GET', '/users/me', accessToken: accessToken)
        as Map<String, dynamic>;
    return ApiUser.fromJson(payload);
  }

  Future<List<ApiServiceCategory>> listCategories() async {
    final payload = await _request('GET', '/services/categories') as List<dynamic>;
    return payload
        .map((item) => ApiServiceCategory.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<ApiService>> listServices({String? categoryId}) async {
    final payload = await _request(
      'GET',
      '/services',
      queryParameters: categoryId == null ? null : {'categoryId': categoryId},
    ) as List<dynamic>;

    return payload
        .map((item) => ApiService.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<ApiBooking> createBooking({
    required String accessToken,
    required String serviceCategoryId,
    required String serviceId,
    required String type,
    String? scheduledAt,
    String? customerAddress,
    String? customerNotes,
    required int quotedPriceCents,
    required String paymentMethod,
  }) async {
    final payload = await _request(
      'POST',
      '/bookings',
      accessToken: accessToken,
      body: {
        'serviceCategoryId': serviceCategoryId,
        'serviceId': serviceId,
        'type': type,
        'scheduledAt': scheduledAt,
        'customerAddress': customerAddress,
        'customerNotes': customerNotes,
        'quotedPriceCents': quotedPriceCents,
        'paymentMethod': paymentMethod,
      },
    ) as Map<String, dynamic>;

    return ApiBooking.fromJson(payload);
  }

  Future<List<ApiBooking>> listMyBookings(String accessToken) async {
    final payload = await _request('GET', '/bookings/mine', accessToken: accessToken)
        as List<dynamic>;
    return payload
        .map((item) => ApiBooking.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<ApiBooking>> listAvailableBookings(String accessToken) async {
    final payload = await _request(
      'GET',
      '/bookings/provider/available',
      accessToken: accessToken,
    ) as List<dynamic>;
    return payload
        .map((item) => ApiBooking.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<ApiBooking> acceptBooking({
    required String accessToken,
    required String bookingId,
  }) async {
    final payload = await _request(
      'PATCH',
      '/bookings/$bookingId/accept',
      accessToken: accessToken,
    ) as Map<String, dynamic>;
    return ApiBooking.fromJson(payload);
  }

  Future<ApiBooking> updateBookingStatus({
    required String accessToken,
    required String bookingId,
    required String status,
  }) async {
    final payload = await _request(
      'PATCH',
      '/bookings/$bookingId/status',
      accessToken: accessToken,
      body: {'status': status},
    ) as Map<String, dynamic>;
    return ApiBooking.fromJson(payload);
  }

  Future<ApiProviderProfile> getMyProviderProfile(String accessToken) async {
    final payload = await _request(
      'GET',
      '/providers/me',
      accessToken: accessToken,
    ) as Map<String, dynamic>;
    return ApiProviderProfile.fromJson(payload);
  }

  Future<List<ApiProviderDocument>> listMyProviderDocuments(String accessToken) async {
    final payload = await _request(
      'GET',
      '/providers/me/documents',
      accessToken: accessToken,
    ) as Map<String, dynamic>;
    final items = payload['documents'] as List<dynamic>? ?? const [];
    return items
        .map((item) => ApiProviderDocument.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<ApiProviderProfile> onboardProvider({
    required String accessToken,
    String? bio,
    String? serviceArea,
    List<String>? serviceCategoryIds,
  }) async {
    final payload = await _request(
      'POST',
      '/providers/onboarding',
      accessToken: accessToken,
      body: {
        'bio': bio,
        'serviceArea': serviceArea,
        'serviceCategoryIds': serviceCategoryIds,
        'documentsSubmitted': false,
      },
    ) as Map<String, dynamic>;
    return ApiProviderProfile.fromJson(payload);
  }

  Future<ApiProviderProfile> updateAvailability({
    required String accessToken,
    required bool isAvailable,
  }) async {
    final payload = await _request(
      'PATCH',
      '/providers/me/availability',
      accessToken: accessToken,
      body: {'isAvailable': isAvailable},
    ) as Map<String, dynamic>;
    return ApiProviderProfile.fromJson(payload);
  }

  Future<ApiProviderDocumentUploadResult> uploadProviderDocument({
    required String accessToken,
    required String documentType,
    required List<int> fileBytes,
    required String fileName,
  }) async {
    final uri = Uri.parse('$baseUrl/providers/me/documents/upload');
    final request = http.MultipartRequest('POST', uri)
      ..headers[HttpHeaders.authorizationHeader] = 'Bearer $accessToken'
      ..headers[HttpHeaders.acceptHeader] = 'application/json'
      ..fields['documentType'] = documentType
      ..files.add(http.MultipartFile.fromBytes('file', fileBytes, filename: fileName));

    try {
      final streamedResponse = await request.send().timeout(const Duration(seconds: 30));
      final response = await http.Response.fromStream(streamedResponse);
      final decoded = response.body.isEmpty ? null : jsonDecode(response.body);

      if (response.statusCode >= 400) {
        throw KaziApiException(
          _extractMessage(decoded) ?? 'Upload failed with status ${response.statusCode}',
          statusCode: response.statusCode,
        );
      }

      return ApiProviderDocumentUploadResult.fromJson(decoded as Map<String, dynamic>);
    } on TimeoutException {
      throw const KaziApiException('The provider document upload timed out.');
    } on SocketException {
      throw KaziApiException('Could not reach KAZI API at $baseUrl.');
    }
  }

  Future<dynamic> _request(
    String method,
    String path, {
    String? accessToken,
    Object? body,
    Map<String, String>? queryParameters,
  }) async {
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: queryParameters);
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 8);

    try {
      final request = await client.openUrl(method, uri);
      request.headers.set(HttpHeaders.acceptHeader, 'application/json');
      if (accessToken != null) {
        request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $accessToken');
      }
      if (body != null) {
        request.headers.contentType = ContentType.json;
        request.write(jsonEncode(body));
      }

      final response = await request.close().timeout(const Duration(seconds: 15));
      final responseText = await response.transform(utf8.decoder).join();
      final decoded = responseText.isEmpty ? null : jsonDecode(responseText);

      if (response.statusCode >= 400) {
        throw KaziApiException(
          _extractMessage(decoded) ?? 'Request failed with status ${response.statusCode}',
          statusCode: response.statusCode,
        );
      }

      return decoded;
    } on TimeoutException {
      throw const KaziApiException('The API request timed out.');
    } on SocketException {
      throw KaziApiException('Could not reach KAZI API at $baseUrl.');
    } finally {
      client.close(force: true);
    }
  }

  String? _extractMessage(dynamic decoded) {
    if (decoded is Map<String, dynamic>) {
      final message = decoded['message'];
      if (message is String) {
        return message;
      }
      if (message is List && message.isNotEmpty) {
        return message.first.toString();
      }
    }

    return null;
  }
}

class KaziSession {
  const KaziSession({
    required this.accessToken,
    required this.refreshToken,
    required this.isNewUser,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final bool isNewUser;
  final ApiUser user;

  factory KaziSession.fromJson(Map<String, dynamic> json) {
    return KaziSession(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      isNewUser: json['isNewUser'] as bool? ?? false,
      user: ApiUser.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

class ApiUser {
  const ApiUser({
    required this.id,
    required this.phone,
    required this.role,
    required this.firstName,
    required this.lastName,
    required this.walletBalanceCents,
  });

  final String id;
  final String phone;
  final String role;
  final String? firstName;
  final String? lastName;
  final int walletBalanceCents;

  String get displayName {
    final fullName = [firstName, lastName].whereType<String>().where((item) => item.isNotEmpty).join(' ');
    return fullName.isEmpty ? phone : fullName;
  }

  factory ApiUser.fromJson(Map<String, dynamic> json) {
    return ApiUser(
      id: json['id'] as String,
      phone: json['phone'] as String,
      role: json['role'] as String,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      walletBalanceCents: (json['walletBalanceCents'] as num?)?.toInt() ?? 0,
    );
  }
}

class ApiServiceCategory {
  const ApiServiceCategory({
    required this.id,
    required this.name,
    required this.slug,
    required this.iconKey,
  });

  final String id;
  final String name;
  final String slug;
  final String? iconKey;

  factory ApiServiceCategory.fromJson(Map<String, dynamic> json) {
    return ApiServiceCategory(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      iconKey: json['iconKey'] as String?,
    );
  }
}

class ApiService {
  const ApiService({
    required this.id,
    required this.categoryId,
    required this.name,
    required this.description,
    required this.basePriceCents,
    required this.estimatedDurationMinutes,
    required this.supportsInstantBooking,
    required this.category,
  });

  final String id;
  final String categoryId;
  final String name;
  final String? description;
  final int basePriceCents;
  final int estimatedDurationMinutes;
  final bool supportsInstantBooking;
  final ApiServiceCategory? category;

  factory ApiService.fromJson(Map<String, dynamic> json) {
    return ApiService(
      id: json['id'] as String,
      categoryId: json['categoryId'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      basePriceCents: (json['basePriceCents'] as num?)?.toInt() ?? 0,
      estimatedDurationMinutes: (json['estimatedDurationMinutes'] as num?)?.toInt() ?? 60,
      supportsInstantBooking: json['supportsInstantBooking'] as bool? ?? true,
      category: json['category'] is Map<String, dynamic>
          ? ApiServiceCategory.fromJson(json['category'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ApiBooking {
  const ApiBooking({
    required this.id,
    required this.bookingRef,
    required this.serviceId,
    required this.serviceCategoryId,
    required this.type,
    required this.status,
    required this.paymentMethod,
    required this.quotedPriceCents,
    required this.finalPriceCents,
    required this.customerAddress,
    required this.createdAt,
    required this.scheduledAt,
  });

  final String id;
  final String bookingRef;
  final String serviceId;
  final String serviceCategoryId;
  final String type;
  final String status;
  final String paymentMethod;
  final int quotedPriceCents;
  final int finalPriceCents;
  final String? customerAddress;
  final DateTime? createdAt;
  final DateTime? scheduledAt;

  int get displayPriceCents => finalPriceCents > 0 ? finalPriceCents : quotedPriceCents;

  factory ApiBooking.fromJson(Map<String, dynamic> json) {
    return ApiBooking(
      id: json['id'] as String,
      bookingRef: json['bookingRef'] as String,
      serviceId: json['serviceId'] as String,
      serviceCategoryId: json['serviceCategoryId'] as String,
      type: json['type'] as String,
      status: json['status'] as String,
      paymentMethod: json['paymentMethod'] as String,
      quotedPriceCents: (json['quotedPriceCents'] as num?)?.toInt() ?? 0,
      finalPriceCents: (json['finalPriceCents'] as num?)?.toInt() ?? 0,
      customerAddress: json['customerAddress'] as String?,
      createdAt: _parseDate(json['createdAt']),
      scheduledAt: _parseDate(json['scheduledAt']),
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value is String && value.isNotEmpty) {
      return DateTime.tryParse(value);
    }
    return null;
  }
}

class ApiProviderProfile {
  const ApiProviderProfile({
    required this.isAvailable,
    required this.verificationStatus,
    required this.documentsSubmitted,
  });

  final bool isAvailable;
  final String verificationStatus;
  final bool documentsSubmitted;

  factory ApiProviderProfile.fromJson(Map<String, dynamic> json) {
    return ApiProviderProfile(
      isAvailable: json['isAvailable'] as bool? ?? false,
      verificationStatus: json['verificationStatus'] as String? ?? 'pending',
      documentsSubmitted: json['documentsSubmitted'] as bool? ?? false,
    );
  }
}

class ApiProviderDocument {
  const ApiProviderDocument({
    required this.id,
    required this.documentType,
    required this.fileName,
    required this.status,
    required this.fileUrl,
  });

  final String id;
  final String documentType;
  final String fileName;
  final String status;
  final String? fileUrl;

  factory ApiProviderDocument.fromJson(Map<String, dynamic> json) {
    return ApiProviderDocument(
      id: json['id'] as String,
      documentType: json['documentType'] as String? ?? 'document',
      fileName: json['fileName'] as String? ?? 'file',
      status: json['status'] as String? ?? 'submitted',
      fileUrl: json['fileUrl'] as String?,
    );
  }
}

class ApiProviderDocumentUploadResult {
  const ApiProviderDocumentUploadResult({
    required this.uploaded,
    required this.documents,
  });

  final ApiProviderDocument uploaded;
  final List<ApiProviderDocument> documents;

  factory ApiProviderDocumentUploadResult.fromJson(Map<String, dynamic> json) {
    final documents = json['documents'] as List<dynamic>? ?? const [];
    return ApiProviderDocumentUploadResult(
      uploaded: ApiProviderDocument.fromJson(json['uploaded'] as Map<String, dynamic>),
      documents: documents
          .map((item) => ApiProviderDocument.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}