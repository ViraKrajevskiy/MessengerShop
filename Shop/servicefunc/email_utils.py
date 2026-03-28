from django.core.mail import EmailMultiAlternatives
from django.conf import settings


def send_verification_email(to_email: str, code: str, username: str = '') -> bool:
    subject = f'{code} — ваш код подтверждения | БизнесТурция'

    text_body = (
        f'Привет{", " + username if username else ""}!\n\n'
        f'Ваш код подтверждения: {code}\n\n'
        f'Код действует 15 минут.\n'
        f'Если вы не регистрировались — просто проигнорируйте это письмо.\n\n'
        f'— Команда БизнесТурция'
    )

    digits_html = ''.join(
        f'<span style="display:inline-block;width:44px;height:52px;line-height:52px;'
        f'text-align:center;font-size:26px;font-weight:800;border-radius:10px;'
        f'background:#1a1a2e;color:#e53935;margin:0 4px;border:2px solid #2d2d44;">'
        f'{ch}</span>'
        for ch in code
    )

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#16162a;border-radius:20px;overflow:hidden;
                      border:1px solid #2d2d44;box-shadow:0 20px 60px rgba(0,0,0,0.4);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e53935,#ff5252);
                        padding:32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:26px;font-weight:900;
                          font-style:italic;letter-spacing:-0.5px;">БизнесТурция</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                Подтверждение email-адреса
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;color:#a0a0c0;font-size:15px;">
                Привет{(", " + username) if username else ""}! 👋
              </p>
              <p style="margin:0 0 28px;color:#e0e0f0;font-size:15px;line-height:1.6;">
                Используйте этот код для подтверждения вашего email-адреса:
              </p>

              <!-- Code -->
              <div style="text-align:center;margin:0 0 28px;">
                {digits_html}
              </div>

              <div style="background:#1a1a2e;border-radius:12px;padding:14px 18px;
                           border-left:4px solid #e53935;margin-bottom:24px;">
                <p style="margin:0;color:#a0a0c0;font-size:13px;line-height:1.5;">
                  ⏱ Код действует <strong style="color:#e0e0f0;">15 минут</strong><br>
                  🔒 Никому не сообщайте этот код
                </p>
              </div>

              <p style="margin:0;color:#606080;font-size:13px;line-height:1.6;">
                Если вы не регистрировались на БизнесТурция — просто проигнорируйте это письмо.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f0f1a;padding:20px 40px;
                        border-top:1px solid #2d2d44;text-align:center;">
              <p style="margin:0;color:#404060;font-size:12px;">
                © 2026 БизнесТурция — Бизнес-справочник для русскоязычных в Турции
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'БизнесТурция <noreply@biznesturcia.com>'),
            to=[to_email],
        )
        msg.attach_alternative(html_body, 'text/html')
        msg.send(fail_silently=False)
        return True
    except Exception as e:
        print(f'[EMAIL ERROR] Не удалось отправить письмо на {to_email}: {e}')
        return False
