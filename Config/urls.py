from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve as serve_media
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf import settings

from Shop.servicefunc.views.seo import sitemap_xml, robots_txt

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('Shop.urls')),

    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # SEO — proxied from nginx at the site root (see nginx.docker.conf)
    path('sitemap.xml', sitemap_xml, name='sitemap'),
    path('robots.txt', robots_txt, name='robots'),
]

# Раздаём загруженные медиафайлы и в проде (DEBUG=False).
# В Docker-схеме nginx проксирует /media/ на Django, поэтому файлы
# должны отдаваться независимо от DEBUG.
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve_media, {'document_root': settings.MEDIA_ROOT}),
]